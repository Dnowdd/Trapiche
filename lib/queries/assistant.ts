import { db } from "../db";
import type { Block, ChatMessage } from "../assistant/types";

export async function getAssistantThreads(userId: string) {
  const threads = await db.assistantThread.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 60,
    select: { id: true, title: true, updatedAt: true },
  });
  return threads.map((t) => ({ ...t, updatedAt: t.updatedAt.toISOString() }));
}

export type ThreadSummary = Awaited<
  ReturnType<typeof getAssistantThreads>
>[number];

export async function getAssistantThread(userId: string, threadId: string) {
  const thread = await db.assistantThread.findFirst({
    where: { id: threadId, userId },
    select: {
      id: true,
      title: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 300,
        select: {
          id: true,
          role: true,
          content: true,
          blocks: true,
          createdAt: true,
        },
      },
    },
  });
  if (!thread) return null;

  const ids = new Set<string>();
  for (const m of thread.messages)
    for (const b of (m.blocks as Block[] | null) ?? [])
      if (b.type === "books") b.books.forEach((x) => ids.add(x.id));
  const shelf = ids.size
    ? await db.userBook.findMany({
        where: { userId, bookId: { in: [...ids] } },
        select: { bookId: true, status: true },
      })
    : [];
  const statusOf = new Map(shelf.map((s) => [s.bookId, s.status]));

  return {
    id: thread.id,
    title: thread.title,
    messages: thread.messages.map((m): ChatMessage => ({
      id: m.id,
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      blocks: ((m.blocks as Block[] | null) ?? []).map((b) =>
        b.type === "books"
          ? {
              ...b,
              books: b.books.map((x) =>
                statusOf.has(x.id)
                  ? { ...x, status: statusOf.get(x.id) ?? null }
                  : x,
              ),
            }
          : b,
      ),
    })),
  };
}
