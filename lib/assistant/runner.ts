import { createHash, randomUUID } from "node:crypto";
import OpenAI from "openai";
import type {
  Response as OpenAIResponse,
  ResponseCreateParamsStreaming,
  ResponseFunctionToolCall,
  ResponseInputItem,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import { db } from "../db";
import { loadBook, toCover } from "../books";
import { today } from "../dates";
import {
  ASSISTANT_NAME,
  DAILY_MESSAGE_LIMIT,
  HISTORY_MESSAGES,
  MAX_TOOL_ROUNDS,
  assistantModel,
  reasoningEffort,
} from "./config";
import { buildInstructions } from "./prompt";
import { TOOL_STATUS, toolsFor } from "./tool-defs";
import { runTool } from "./tools";
import type { Block, StreamEvent } from "./types";

export interface ResponsesClient {
  responses: {
    create(
      body: ResponseCreateParamsStreaming,
      options?: { signal?: AbortSignal },
    ): Promise<AsyncIterable<ResponseStreamEvent>>;
  };
}

let shared: ResponsesClient | null = null;

export function openaiClient(): ResponsesClient {
  if (shared) return shared;
  const client = new OpenAI({ timeout: 90_000, maxRetries: 1 });
  shared = {
    responses: {
      create: (body, options) => client.responses.create(body, options),
    },
  };
  return shared;
}

export interface RunInput {
  userId: string;
  shareData: boolean;
  name: string;
  handle: string;
  threadId: string | null;
  message: string;
  bookId: string | null;
  signal: AbortSignal;
  send: (event: StreamEvent) => void;
  client?: ResponsesClient;
}

export class AssistantRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function consumeDailyMessage(userId: string) {
  const usage = await db.assistantUsage.upsert({
    where: { userId_day: { userId, day: today() } },
    create: { userId, day: today(), messages: 1 },
    update: { messages: { increment: 1 } },
    select: { messages: true },
  });
  if (usage.messages > DAILY_MESSAGE_LIMIT)
    throw new AssistantRequestError(
      `Você usou as ${DAILY_MESSAGE_LIMIT} mensagens de hoje com o ${ASSISTANT_NAME}. Amanhã tem mais.`,
      429,
    );
  return DAILY_MESSAGE_LIMIT - usage.messages;
}

function titleFrom(message: string) {
  const clean = message.replace(/\s+/g, " ").trim();
  return clean.length > 64 ? `${clean.slice(0, 63).trimEnd()}…` : clean;
}

function blockNote(blocks: Block[]) {
  const notes = blocks.map((b) => {
    if (b.type === "books")
      return `⟦capas mostradas: ${b.books.map((x) => `“${x.title}” (id ${x.id})`).join(", ")}⟧`;
    const a = b.action;
    const state = {
      pending: "aguardando confirmação",
      done: "confirmado pelo leitor",
      dismissed: "cancelado pelo leitor",
      failed: `não deu certo${a.result ? `: ${a.result}` : ""}`,
    }[a.status];
    return `⟦cartão: ${a.title} — ${a.detail} (${state})⟧`;
  });
  return notes.join("\n");
}

async function history(threadId: string): Promise<ResponseInputItem[]> {
  const rows = await db.assistantMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_MESSAGES,
    select: { role: true, content: true, blocks: true },
  });
  return rows.reverse().map((m) => {
    if (m.role === "USER") return { role: "user" as const, content: m.content };
    const blocks = (m.blocks as Block[] | null) ?? [];
    const note = blocks.length ? blockNote(blocks) : "";
    const content =
      m.content.length > HISTORY_CHARS
        ? `${m.content.slice(0, HISTORY_CHARS)}…`
        : m.content;
    return {
      role: "assistant" as const,
      content: [content, note].filter(Boolean).join("\n\n") || "…",
    };
  });
}

async function bookContext(bookId: string | null) {
  if (!bookId) return null;
  const book = await loadBook(bookId).catch(() => null);
  if (!book) return null;
  return { id: bookId, title: book.title, author: toCover(book).author };
}

function friendlyError(err: unknown) {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429)
      return `O ${ASSISTANT_NAME} está muito requisitado agora. Tente de novo em um minuto.`;
    if (err.status === 401 || err.status === 403)
      return `O ${ASSISTANT_NAME} está fora do ar no momento. Já estamos vendo isso.`;
    if (err.status === 400 && /context|too long|maximum/i.test(err.message))
      return "A conversa ficou longa demais. Comece uma nova conversa.";
  }
  return `O ${ASSISTANT_NAME} se perdeu no caminho. Tente de novo.`;
}

const HISTORY_CHARS = 4000;

const PERSISTABLE = new Set(["message", "function_call", "reasoning"]);

export async function runAssistant(input: RunInput) {
  const { userId, send, signal } = input;
  const client = input.client ?? openaiClient();
  const model = assistantModel();
  const effort = reasoningEffort();

  let threadId = input.threadId;
  let title: string;
  if (threadId) {
    const thread = await db.assistantThread.findFirst({
      where: { id: threadId, userId },
      select: { title: true },
    });
    if (!thread)
      throw new AssistantRequestError("Essa conversa não existe mais.", 404);
    title = thread.title;
  } else {
    title = titleFrom(input.message);
    const thread = await db.assistantThread.create({
      data: { userId, title },
      select: { id: true },
    });
    threadId = thread.id;
  }

  const messageId = randomUUID();
  send({ type: "thread", threadId, title, messageId });

  await db.assistantMessage.create({
    data: { threadId, role: "USER", content: input.message },
  });

  const [items, book] = await Promise.all([
    history(threadId),
    bookContext(input.bookId),
  ]);
  const instructions = buildInstructions({
    shareData: input.shareData,
    name: input.name,
    handle: input.handle,
    book,
  });

  const blocks: Block[] = [];
  let text = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let failed: string | null = null;

  const ctx = {
    userId,
    shareData: input.shareData,
    emit(block: Block) {
      const placed = { ...block, at: text.length };
      blocks.push(placed);
      send({ type: "block", block: placed });
    },
  };

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const last = round === MAX_TOOL_ROUNDS - 1;
      const stream = await client.responses.create(
        {
          model,
          instructions,
          input: items,
          tools: toolsFor(input.shareData),
          tool_choice: last ? "none" : "auto",
          parallel_tool_calls: true,
          stream: true,
          store: false,
          max_output_tokens: 4000,
          prompt_cache_key: "trapiche-assistant-v1",
          safety_identifier: createHash("sha256")
            .update(userId)
            .digest("hex")
            .slice(0, 32),
          ...(effort
            ? {
                reasoning: {
                  effort: effort as NonNullable<
                    ResponseCreateParamsStreaming["reasoning"]
                  >["effort"],
                },
                include: ["reasoning.encrypted_content" as const],
              }
            : {}),
        },
        { signal },
      );

      let final: OpenAIResponse | null = null;
      let broke = false;
      for await (const event of stream) {
        if (
          event.type === "response.output_text.delta" ||
          event.type === "response.refusal.delta"
        ) {
          if (!broke && text && !text.endsWith("\n\n")) {
            text += "\n\n";
            send({ type: "delta", text: "\n\n" });
          }
          broke = true;
          text += event.delta;
          send({ type: "delta", text: event.delta });
        } else if (
          event.type === "response.output_item.added" &&
          event.item.type === "function_call"
        ) {
          send({
            type: "status",
            label:
              TOOL_STATUS[event.item.name] ??
              (event.item.name.startsWith("propose_")
                ? "Preparando o cartão…"
                : "Pensando…"),
          });
        } else if (
          event.type === "response.completed" ||
          event.type === "response.incomplete"
        ) {
          final = event.response;
        } else if (event.type === "response.failed") {
          throw new Error(event.response.error?.message ?? "response.failed");
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
      if (!final) throw new Error("stream ended without a response");

      inputTokens += final.usage?.input_tokens ?? 0;
      outputTokens += final.usage?.output_tokens ?? 0;

      const calls = final.output.filter(
        (o): o is ResponseFunctionToolCall => o.type === "function_call",
      );
      items.push(
        ...(final.output.filter((o) =>
          PERSISTABLE.has(o.type),
        ) as ResponseInputItem[]),
      );
      if (!calls.length || final.status === "incomplete") break;

      for (const call of calls) {
        let output: unknown;
        try {
          const args = JSON.parse(call.arguments || "{}");
          output = await runTool(call.name, args, ctx);
        } catch (err) {
          console.error("[assistant] tool failed", call.name, err);
          output = { error: "A ferramenta falhou. Tente outro caminho." };
        }
        items.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(output),
        });
      }
      send({ type: "status", label: "Escrevendo…" });
    }
  } catch (err) {
    if (!signal.aborted) {
      console.error("[assistant]", err);
      failed = friendlyError(err);
    }
  }

  const content = text.trim();
  if (content || blocks.length) {
    await db.assistantMessage.create({
      data: {
        id: messageId,
        threadId,
        role: "ASSISTANT",
        content,
        blocks: blocks as object[],
        model,
        inputTokens,
        outputTokens,
      },
    });
  }
  await Promise.all([
    db.assistantThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    }),
    inputTokens || outputTokens
      ? db.assistantUsage.upsert({
          where: { userId_day: { userId, day: today() } },
          create: { userId, day: today(), inputTokens, outputTokens },
          update: {
            inputTokens: { increment: inputTokens },
            outputTokens: { increment: outputTokens },
          },
        })
      : null,
  ]);

  if (failed) send({ type: "error", message: failed });
  else if (!content && !blocks.length && !signal.aborted)
    send({
      type: "error",
      message: `O ${ASSISTANT_NAME} ficou sem palavras. Tente perguntar de outro jeito.`,
    });
  return { threadId, messageId, saved: Boolean(content || blocks.length) };
}
