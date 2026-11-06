import { db } from "../db";
import { ensureBook } from "../books";
import { authorSurname, sameTitle } from "../editions";
import { editionIdByIsbn, searchOpenLibrary } from "../open-library";
import { fetchVolumes } from "../google-books";
import { editionIds } from "../works";
import { TAG_COLORS } from "../tags";
import type { ImportRow, Prisma } from "../generated/prisma/client";

export const BATCH_SIZE = 6;

function authorMatches(
  candidates: string[] | undefined,
  author: string | null,
) {
  if (!author) return true;
  const surname = authorSurname(author);
  return (candidates ?? []).some((a) => authorSurname(a) === surname);
}

export async function matchBook(row: {
  title: string;
  author: string | null;
  isbn: string | null;
}) {
  if (row.isbn) {
    const id = await editionIdByIsbn(row.isbn, row.title).catch(() => null);
    if (id) return id;
  }
  const query = [row.title, row.author].filter(Boolean).join(" ");
  const open = await searchOpenLibrary(query, 10).catch(() => []);
  const hit = open.find(
    (v) =>
      (sameTitle(v.volumeInfo.title, row.title) ||
        (v.volumeInfo.olWorkTitle &&
          sameTitle(v.volumeInfo.olWorkTitle, row.title))) &&
      authorMatches(v.volumeInfo.authors, row.author),
  );
  if (hit) return hit.id;
  const google = await fetchVolumes(
    row.isbn ? `isbn:${row.isbn}` : query,
    10,
  ).catch(() => []);
  const g = google.find(
    (v) =>
      sameTitle(v.volumeInfo.title, row.title) &&
      authorMatches(v.volumeInfo.authors, row.author),
  );
  return g?.id ?? null;
}

type Tx = Prisma.TransactionClient;

async function tagIds(tx: Tx, userId: string, names: string[]) {
  if (!names.length) return [];
  const existing = await tx.tag.findMany({
    where: { userId },
    select: { id: true, name: true },
  });
  const ids: string[] = [];
  let count = existing.length;
  for (const name of names) {
    const found = existing.find(
      (t) => t.name.toLowerCase() === name.toLowerCase(),
    );
    if (found) {
      ids.push(found.id);
      continue;
    }
    if (count >= 50) continue;
    const tag = await tx.tag.create({
      data: { userId, name, color: TAG_COLORS[count % TAG_COLORS.length] },
      select: { id: true, name: true },
    });
    existing.push(tag);
    ids.push(tag.id);
    count++;
  }
  return ids;
}

export async function applyRow(
  userId: string,
  row: ImportRow,
  bookId: string,
): Promise<"IMPORTED" | "SKIPPED"> {
  const book = await ensureBook(bookId);
  const ids = await editionIds(bookId);
  const existing = await db.userBook.findFirst({
    where: { userId, bookId: { in: ids }, status: { not: null } },
    select: { id: true },
  });
  if (existing) return "SKIPPED";
  const status = row.shelf ?? "WANT";
  const finishedAt = row.dateRead ?? null;

  await db.$transaction(async (tx) => {
    const entry = await tx.userBook.upsert({
      where: { userId_bookId: { userId, bookId } },
      create: {
        userId,
        bookId,
        status,
        statusChangedAt: finishedAt ?? new Date(),
        currentPage: status === "READ" ? (book.pageCount ?? 0) : 0,
      },
      update: {
        status,
        statusChangedAt: finishedAt ?? new Date(),
        currentPage: status === "READ" ? (book.pageCount ?? 0) : 0,
      },
    });
    if (status === "READ" || status === "READING" || status === "REREADING")
      await tx.reading.create({
        data: {
          userId,
          bookId,
          number: 1,
          status: status === "READ" ? "FINISHED" : "ACTIVE",
          endedAt: status === "READ" ? finishedAt : null,
          endPrecision: "DAY",
        },
      });
    if (status === "ABANDONED")
      await tx.reading.create({
        data: { userId, bookId, number: 1, status: "ABANDONED" },
      });
    if (row.rating) {
      const has = await tx.review.findFirst({
        where: { userId, bookId: { in: ids } },
        select: { id: true },
      });
      if (!has)
        await tx.review.create({
          data: {
            userId,
            bookId,
            rating: row.rating,
            text: row.review,
          },
        });
    }
    const tags = await tagIds(tx, userId, row.tags);
    if (tags.length)
      await tx.userBookTag.createMany({
        data: tags.map((tagId) => ({ userBookId: entry.id, tagId })),
        skipDuplicates: true,
      });
  });
  return "IMPORTED";
}

export async function processRow(userId: string, row: ImportRow) {
  try {
    const bookId = await matchBook(row);
    if (!bookId)
      return db.importRow.update({
        where: { id: row.id },
        data: { status: "NOT_FOUND" },
      });
    const status = await applyRow(userId, row, bookId);
    return db.importRow.update({
      where: { id: row.id },
      data: { status, bookId },
    });
  } catch (err) {
    console.error("[import] row failed", row.id, err);
    return db.importRow.update({
      where: { id: row.id },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message.slice(0, 300) : "erro",
      },
    });
  }
}
