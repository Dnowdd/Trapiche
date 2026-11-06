import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  BURST_LIMIT,
  MAX_MESSAGE_CHARS,
  assistantEnabled,
} from "@/lib/assistant/config";
import {
  AssistantRequestError,
  consumeDailyMessage,
  runAssistant,
} from "@/lib/assistant/runner";
import type { StreamEvent } from "@/lib/assistant/types";

export const maxDuration = 120;

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

const ID = /^[\w-]{1,80}$/;

export async function POST(request: Request) {
  if (!assistantEnabled())
    return fail("O assistente não está disponível agora.", 503);
  const session = await getSession();
  if (!session) return fail("Entre na sua conta.", 401);

  const origin = request.headers.get("origin");
  const hosts = [
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
    new URL(request.url).host,
  ];
  if (origin && !hosts.includes(URL.parse(origin)?.host ?? "invalid"))
    return fail("Origem não permitida.", 403);

  const body = (await request.json().catch(() => null)) as {
    message?: unknown;
    threadId?: unknown;
    bookId?: unknown;
  } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return fail("Escreva uma mensagem.", 400);
  if (message.length > MAX_MESSAGE_CHARS)
    return fail(
      `A mensagem pode ter até ${MAX_MESSAGE_CHARS.toLocaleString("pt-BR")} caracteres.`,
      400,
    );
  const threadId =
    typeof body?.threadId === "string" && ID.test(body.threadId)
      ? body.threadId
      : null;
  const bookId =
    typeof body?.bookId === "string" && ID.test(body.bookId)
      ? body.bookId
      : null;

  const userId = session.user.id;
  const burst = await consumeRateLimit(
    `assistant:${userId}`,
    BURST_LIMIT,
    60_000,
  );
  if (burst.limited)
    return fail("Calma, uma pergunta de cada vez. Tente em um minuto.", 429);

  if (
    threadId &&
    !(await db.assistantThread.count({ where: { id: threadId, userId } }))
  )
    return fail("Essa conversa não existe mais.", 404);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, handle: true, assistantShareData: true },
  });
  if (!user) return fail("Entre na sua conta.", 401);

  let remaining: number;
  try {
    remaining = await consumeDailyMessage(userId);
  } catch (err) {
    if (err instanceof AssistantRequestError)
      return fail(err.message, err.status);
    throw err;
  }

  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort());
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => {
        if (abort.signal.aborted) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          abort.abort();
        }
      };
      try {
        const result = await runAssistant({
          userId,
          shareData: user.assistantShareData,
          name: user.name,
          handle: user.handle,
          threadId,
          message,
          bookId,
          signal: abort.signal,
          send,
        });
        send({
          type: "done",
          messageId: result.saved ? result.messageId : null,
          remaining,
        });
      } catch (err) {
        if (!(err instanceof AssistantRequestError))
          console.error("[assistant] route", err);
        send({
          type: "error",
          message:
            err instanceof AssistantRequestError
              ? err.message
              : "Algo deu errado. Tente de novo.",
        });
      } finally {
        try {
          controller.close();
        } catch {
          abort.abort();
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
