"use server";

import { db } from "../db";
import { partialToISO, todayISO } from "../dates";
import type { Prisma } from "../generated/prisma/client";
import type { ActionCard, Block } from "../assistant/types";
import { getAssistantThread, getAssistantThreads } from "../queries/assistant";
import { fail, withUser, type ActionResult } from "./result";
import { finishBook, logReadingSession, setShelfStatus } from "./shelf";
import { saveReview } from "./reviews";
import { addQuote } from "./quotes";
import { addBookToList, createList } from "./lists";
import { setReadingGoal } from "./goals";
import { createChallenge } from "./challenges";
import { lendBook } from "./loans";
import type { ChallengeKindId } from "../challenges";

export async function listAssistantThreads() {
  return withUser((userId) => getAssistantThreads(userId));
}

export async function loadAssistantThread(threadId: string) {
  return withUser(async (userId) => {
    const thread = await getAssistantThread(userId, threadId);
    if (!thread) fail("Essa conversa não existe mais.");
    return thread;
  });
}

export async function getAssistantDataSharing() {
  return withUser(async (userId) => {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { assistantShareData: true },
    });
    return { enabled: user?.assistantShareData ?? false };
  });
}

export async function setAssistantDataSharing(enabled: boolean) {
  return withUser(async (userId) => {
    await db.user.update({
      where: { id: userId },
      data: { assistantShareData: enabled === true },
    });
    return { enabled: enabled === true };
  });
}

export async function deleteAssistantThread(threadId: string) {
  return withUser(async (userId) => {
    await db.assistantThread.deleteMany({ where: { id: threadId, userId } });
  });
}

export async function deleteAllAssistantThreads() {
  return withUser(async (userId) => {
    await db.assistantThread.deleteMany({ where: { userId } });
  });
}

type Outcome =
  | { ok: true; message: string; href: string | null }
  | { ok: false; error: string };

const text = (v: unknown) => (typeof v === "string" ? v : "");
const numOrNull = (v: unknown) => (typeof v === "number" ? v : null);

function outcome(
  result: ActionResult<unknown>,
  message: string,
  href: string | null,
): Outcome {
  return result.ok
    ? { ok: true, message, href }
    : { ok: false, error: result.error };
}

async function execute(userId: string, action: ActionCard): Promise<Outcome> {
  const p = action.params;
  const bookId = text(p.bookId);
  const bookHref = bookId ? `/book/${bookId}` : null;

  switch (action.kind) {
    case "shelf_status": {
      const reading = p.status === "READING";
      return outcome(
        await setShelfStatus(
          bookId,
          reading ? "READING" : "WANT",
          reading ? { startedAt: todayISO() } : {},
        ),
        reading ? "Boa leitura!" : "Está na sua pilha de “Quero ler”.",
        bookHref,
      );
    }
    case "finish_book": {
      const active = await db.reading.findFirst({
        where: { userId, bookId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        select: { startedAt: true, startPrecision: true },
      });
      const rating = numOrNull(p.rating);
      return outcome(
        await finishBook(bookId, {
          startedAt: active?.startedAt
            ? partialToISO(active.startedAt, active.startPrecision)
            : undefined,
          finishedAt: text(p.finishedOn) || todayISO(),
          review: rating
            ? { rating, text: text(p.review) || undefined }
            : undefined,
        }),
        "Mais um para a conta. Parabéns!",
        bookHref,
      );
    }
    case "log_session": {
      const result = await logReadingSession(bookId, {
        date: text(p.date) || todayISO(),
        minutes: Number(p.minutes),
        pageEnd: numOrNull(p.pageEnd) ?? undefined,
        percentEnd: numOrNull(p.percentEnd) ?? undefined,
        audioPosition:
          numOrNull(p.audioPosition) != null
            ? String(p.audioPosition)
            : undefined,
      });
      const reachedEnd =
        result.ok && (result.data as { reachedEnd?: boolean })?.reachedEnd;
      return outcome(
        result,
        reachedEnd
          ? "Registrado. Parece que você chegou ao fim!"
          : "Leitura registrada.",
        bookHref,
      );
    }
    case "review":
      return outcome(
        await saveReview(bookId, {
          rating: Number(p.rating),
          text: text(p.text) || undefined,
        }),
        "Avaliação salva.",
        bookHref ? `${bookHref}#resenhas` : null,
      );
    case "quote":
      return outcome(
        await addQuote(bookId, { text: text(p.text), page: numOrNull(p.page) }),
        "Citação guardada.",
        bookHref ? `${bookHref}/citacoes` : null,
      );
    case "create_list": {
      const created = await createList({
        title: text(p.title),
        note: text(p.note) || undefined,
        visibility: text(p.visibility) || "PUBLIC",
      });
      if (!created.ok) return { ok: false, error: created.error };
      const listId = created.data!.id;
      const ids = Array.isArray(p.bookIds) ? p.bookIds.map(String) : [];
      for (const id of ids) await addBookToList(listId, id);
      return {
        ok: true,
        message: "Lista criada.",
        href: `/lists/${listId}`,
      };
    }
    case "add_to_list": {
      const listId = text(p.listId);
      const ids = Array.isArray(p.bookIds) ? p.bookIds.map(String) : [];
      let added = 0;
      let error: string | null = null;
      for (const id of ids) {
        const r = await addBookToList(listId, id);
        if (r.ok) added++;
        else error ??= r.error;
      }
      if (!added && error) return { ok: false, error };
      return {
        ok: true,
        message:
          added === 1 ? "Livro adicionado." : `${added} livros adicionados.`,
        href: `/lists/${listId}`,
      };
    }
    case "goal":
      return outcome(
        await setReadingGoal(Number(p.year), Number(p.target)),
        "Meta definida. Bora!",
        "/",
      );
    case "challenge":
      return outcome(
        await createChallenge({
          title: text(p.title),
          kind: text(p.kind) as ChallengeKindId,
          value: text(p.value) || null,
          target: Number(p.target),
          startsAt: text(p.startsAt),
          endsAt: text(p.endsAt),
        }),
        "Desafio criado. Boa sorte!",
        "/",
      );
    case "loan":
      return outcome(
        await lendBook(bookId, {
          person: text(p.person),
          dueAt: text(p.dueAt) || null,
        }),
        `Anotado: está com ${text(p.person)}.`,
        bookHref ? `${bookHref}#emprestimo` : null,
      );
  }
}

async function findAction(userId: string, messageId: string, actionId: string) {
  const message = await db.assistantMessage.findFirst({
    where: { id: messageId, thread: { userId } },
    select: { blocks: true },
  });
  const blocks = (message?.blocks as Block[] | null) ?? [];
  const index = blocks.findIndex(
    (b) => b.type === "action" && b.action.id === actionId,
  );
  if (index < 0)
    fail(
      "Não encontrei esse cartão. Espere a resposta terminar e tente de novo.",
    );
  return {
    blocks,
    index,
    action: (blocks[index] as { action: ActionCard }).action,
  };
}

function patched(blocks: Block[], index: number, patch: Partial<ActionCard>) {
  return blocks.map((b, i) =>
    i === index && b.type === "action"
      ? { ...b, action: { ...b.action, ...patch } }
      : b,
  );
}

async function swap(messageId: string, before: Block[], after: Block[]) {
  const { count } = await db.assistantMessage.updateMany({
    where: {
      id: messageId,
      blocks: { equals: before as unknown as Prisma.InputJsonValue },
    },
    data: { blocks: after as unknown as Prisma.InputJsonValue },
  });
  return count > 0;
}

export async function confirmAssistantAction(
  messageId: string,
  actionId: string,
) {
  return withUser(async (userId): Promise<ActionCard> => {
    const { blocks, index, action } = await findAction(
      userId,
      messageId,
      actionId,
    );
    if (action.status !== "pending") return action;
    const claimed = patched(blocks, index, {
      status: "failed",
      result: "A ação foi interrompida. Peça de novo.",
    });
    if (!(await swap(messageId, blocks, claimed)))
      fail("Esse cartão já foi usado.");

    const result = await execute(userId, action).catch((err) => {
      console.error("[assistant] confirm", err);
      return { ok: false as const, error: "Algo deu errado. Tente de novo." };
    });
    const final: Partial<ActionCard> = result.ok
      ? { status: "done", result: result.message, href: result.href }
      : { status: "failed", result: result.error };
    await db.assistantMessage.update({
      where: { id: messageId },
      data: {
        blocks: patched(
          claimed,
          index,
          final,
        ) as unknown as Prisma.InputJsonValue,
      },
    });
    return { ...action, ...final };
  });
}

export async function dismissAssistantAction(
  messageId: string,
  actionId: string,
) {
  return withUser(async (userId): Promise<ActionCard> => {
    const { blocks, index, action } = await findAction(
      userId,
      messageId,
      actionId,
    );
    if (action.status !== "pending") return action;
    const patch = { status: "dismissed" as const, result: null };
    if (!(await swap(messageId, blocks, patched(blocks, index, patch))))
      fail("Esse cartão já foi usado.");
    return { ...action, ...patch };
  });
}
