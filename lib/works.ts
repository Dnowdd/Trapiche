import { cache } from "react";
import { db } from "./db";
import { cleanAuthor, workKey } from "./editions";

export async function linkWork(book: {
  id: string;
  title: string;
  authors: string[];
  workId?: string | null;
}) {
  if (book.workId) return book.workId;
  const author = book.authors[0] ? cleanAuthor(book.authors[0]) : undefined;
  const key = workKey(book.title, author);
  if (!key.split("|")[0]) return null;
  const work = await db.work.upsert({
    where: { key },
    create: { key, title: book.title, author: author ?? null },
    update: {},
  });
  await db.book
    .update({ where: { id: book.id }, data: { workId: work.id } })
    .catch(() => null);
  return work.id;
}

export const editionIds = cache(async (bookId: string) => {
  const book = await db.book.findUnique({
    where: { id: bookId },
    select: { workId: true },
  });
  if (!book?.workId) return [bookId];
  const siblings = await db.book.findMany({
    where: { workId: book.workId },
    select: { id: true },
  });
  const ids = siblings.map((b) => b.id);
  return ids.includes(bookId) ? ids : [bookId, ...ids];
});
