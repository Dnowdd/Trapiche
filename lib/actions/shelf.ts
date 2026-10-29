"use server";

import { refresh } from "next/cache";
import { db } from "../db";
import { ensureBook } from "../books";
import { editionIds } from "../works";
import {
  dayFromISO,
  isISODay,
  parsePartialISO,
  periodEnd,
  spanDays,
  today,
  toISODay,
  type PartialDate,
} from "../dates";
import { fail, withUser } from "./result";
import type { ActivityKind, Prisma } from "../generated/prisma/client";

type Tx = Prisma.TransactionClient;

export type SimpleStatus = "WANT" | "READING" | "REREADING";

const MAX_FAVORITES = 5;

async function shelfEntry(tx: Tx, userId: string, bookId: string) {
  return tx.userBook.upsert({
    where: { userId_bookId: { userId, bookId } },
    create: { userId, bookId },
    update: {},
  });
}

async function activeReading(tx: Tx, userId: string, bookId: string) {
  return tx.reading.findFirst({
    where: { userId, bookId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
}

const SHELF_KINDS: ActivityKind[] = [
  "ADDED_TO_SHELF",
  "STARTED",
  "FINISHED",
  "ABANDONED",
];
const UNDO_WINDOW_MS = 30 * 60_000;

async function logShelfActivity(
  tx: Tx,
  data: Prisma.ActivityUncheckedCreateInput & { bookId: string },
) {
  await tx.activity.deleteMany({
    where: {
      userId: data.userId,
      bookId: data.bookId,
      kind: { in: SHELF_KINDS },
      createdAt: { gte: new Date(Date.now() - UNDO_WINDOW_MS) },
    },
  });
  await tx.activity.create({ data });
}

async function undoRecentFinish(
  tx: Tx,
  entry: {
    userId: string;
    bookId: string;
    status: string | null;
    statusChangedAt: Date | null;
  },
) {
  const recent =
    entry.status === "READ" &&
    entry.statusChangedAt &&
    Date.now() - entry.statusChangedAt.getTime() < UNDO_WINDOW_MS;
  if (!recent) return;
  const { userId, bookId } = entry;
  const last = await tx.reading.findFirst({
    where: { userId, bookId, status: "FINISHED" },
    orderBy: { number: "desc" },
  });
  if (!last) return;
  await tx.reading.update({
    where: { id: last.id },
    data: { status: "ACTIVE", endedAt: null, endPrecision: "DAY" },
  });
  await tx.activity.deleteMany({
    where: {
      userId,
      bookId,
      kind: "FINISHED",
      createdAt: { gte: new Date(Date.now() - UNDO_WINDOW_MS) },
    },
  });
}

async function finishedCount(tx: Tx, userId: string, bookId: string) {
  return tx.reading.count({ where: { userId, bookId, status: "FINISHED" } });
}

async function closeActive(
  tx: Tx,
  userId: string,
  bookId: string,
  currentPage: number,
) {
  const active = await activeReading(tx, userId, bookId);
  if (!active) return;
  const sessions = await tx.readingSession.count({
    where: { readingId: active.id },
  });
  if (sessions === 0) {
    await tx.reading.delete({ where: { id: active.id } });
    await dropUnlinkedActivity(tx, userId, bookId, "STARTED");
    return;
  }
  await tx.reading.update({
    where: { id: active.id },
    data: { status: "ABANDONED", endedAt: today(), endPage: currentPage },
  });
}

function parseDay(value: unknown, label: string) {
  if (!isISODay(value)) fail(`Informe ${label}.`);
  const d = dayFromISO(value);
  if (Number.isNaN(d.getTime())) fail(`Informe ${label}.`);
  if (d > today())
    fail(`${label[0].toUpperCase()}${label.slice(1)} não pode ser no futuro.`);
  return d;
}

function parsePartial(value: unknown, label: string): PartialDate | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "string" ? parsePartialISO(value) : null;
  if (!parsed) fail(`Confira ${label}.`);
  if (parsed.date > today())
    fail(`${label[0].toUpperCase()}${label.slice(1)} não pode ser no futuro.`);
  return parsed;
}

function parseOptionalText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  if (v.length > max) fail(`O texto pode ter no máximo ${max} caracteres.`);
  return v;
}

function parsePage(value: unknown, pageCount: number | null) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) fail("Informe uma página válida.");
  if (pageCount && n > pageCount) fail(`Esse livro tem ${pageCount} páginas.`);
  return n;
}

export async function setShelfStatus(
  bookId: string,
  status: SimpleStatus | null,
) {
  return withUser(async (userId) => {
    await ensureBook(bookId);
    await db.$transaction(async (tx) => {
      const entry = await shelfEntry(tx, userId, bookId);
      if (entry.status === status) return;

      if (status === null) {
        await tx.reading.deleteMany({ where: { userId, bookId } });
        await tx.activity.deleteMany({
          where: { userId, bookId, kind: { in: SHELF_KINDS } },
        });
        await tx.userBook.update({
          where: { id: entry.id },
          data: {
            status: null,
            statusChangedAt: new Date(),
            currentPage: 0,
            abandonReason: null,
            wantsToReturn: true,
          },
        });
        return;
      }

      if (status !== "REREADING") await undoRecentFinish(tx, entry);

      if (status === "WANT") {
        await closeActive(tx, userId, bookId, entry.currentPage);
        await tx.userBook.update({
          where: { id: entry.id },
          data: { status, statusChangedAt: new Date(), currentPage: 0 },
        });
        await logShelfActivity(tx, {
          userId,
          bookId,
          kind: "ADDED_TO_SHELF",
          text: "Quero ler",
        });
        return;
      }

      const active = await activeReading(tx, userId, bookId);
      if (!active) {
        const done = await finishedCount(tx, userId, bookId);
        if (status === "REREADING" && done === 0)
          fail("Você ainda não terminou esse livro. Marque como “Lendo”.");
        const reading = await tx.reading.create({
          data: {
            userId,
            bookId,
            number: done + 1,
            startedAt: today(),
          },
        });
        await logShelfActivity(tx, {
          userId,
          bookId,
          kind: "STARTED",
          readingId: reading.id,
        });
      }
      await tx.userBook.update({
        where: { id: entry.id },
        data: {
          status,
          statusChangedAt: new Date(),
          currentPage: active ? entry.currentPage : 0,
          abandonReason: null,
        },
      });
    });
    refresh();
  });
}

export async function finishBook(
  bookId: string,
  input: { startedAt?: string; finishedAt?: string; note?: string },
) {
  return withUser(async (userId) => {
    const book = await ensureBook(bookId);
    const dates = parseDates(input);
    const note = parseOptionalText(input.note, 500);
    const days = spanDays(dates);
    await db.$transaction(async (tx) => {
      const entry = await shelfEntry(tx, userId, bookId);
      const active = await activeReading(tx, userId, bookId);

      const reading = active
        ? await tx.reading.update({
            where: { id: active.id },
            data: { status: "FINISHED", ...dates },
          })
        : await tx.reading.create({
            data: {
              userId,
              bookId,
              number: (await finishedCount(tx, userId, bookId)) + 1,
              status: "FINISHED",
              ...dates,
            },
          });
      await tx.userBook.update({
        where: { id: entry.id },
        data: {
          status: "READ",
          statusChangedAt: new Date(),
          currentPage: book.pageCount ?? entry.currentPage,
          abandonReason: null,
          ...(note ? { note } : {}),
        },
      });
      await renumber(tx, userId, bookId);
      await logShelfActivity(tx, {
        userId,
        bookId,
        kind: "FINISHED",
        days,
        readingId: reading.id,
      });
    });
    refresh();
    return { days };
  });
}

export async function abandonBook(
  bookId: string,
  input: { page: number | string; reason?: string; wantsToReturn: boolean },
) {
  return withUser(async (userId) => {
    const book = await ensureBook(bookId);
    const page = parsePage(input.page, book.pageCount);
    const reason = parseOptionalText(input.reason, 500);
    await db.$transaction(async (tx) => {
      const entry = await shelfEntry(tx, userId, bookId);
      const active = await activeReading(tx, userId, bookId);
      const reading = active
        ? await tx.reading.update({
            where: { id: active.id },
            data: { status: "ABANDONED", endedAt: today(), endPage: page },
          })
        : await tx.reading.create({
            data: {
              userId,
              bookId,
              number: (await finishedCount(tx, userId, bookId)) + 1,
              status: "ABANDONED",
              startedAt: today(),
              endedAt: today(),
              endPage: page,
            },
          });
      await tx.userBook.update({
        where: { id: entry.id },
        data: {
          status: "ABANDONED",
          statusChangedAt: new Date(),
          currentPage: page,
          abandonReason: reason,
          wantsToReturn: Boolean(input.wantsToReturn),
        },
      });
      await logShelfActivity(tx, {
        userId,
        bookId,
        kind: "ABANDONED",
        text: reason,
        readingId: reading.id,
      });
    });
    refresh();
  });
}

export async function logReadingSession(
  bookId: string,
  input: {
    date: string;
    pageEnd: number | string;
    minutes: number | string;
    note?: string;
  },
) {
  return withUser(async (userId) => {
    const book = await ensureBook(bookId);
    const date = parseDay(input.date, "a data");
    const pageEnd = parsePage(input.pageEnd, book.pageCount);
    const minutes = Number(input.minutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)
      fail("Informe quantos minutos você leu (de 1 a 1440).");
    const note = parseOptionalText(input.note, 500);

    const reachedEnd = await db.$transaction(async (tx) => {
      const entry = await shelfEntry(tx, userId, bookId);
      const active = await activeReading(tx, userId, bookId);
      if (
        !active ||
        (entry.status !== "READING" && entry.status !== "REREADING")
      )
        fail("Marque o livro como “Lendo” antes de registrar uma leitura.");

      const previous = await tx.readingSession.findFirst({
        where: { readingId: active.id, date: { lte: date } },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      });
      const later = await tx.readingSession.findFirst({
        where: { readingId: active.id, date: { gt: date } },
      });
      const startPage =
        previous?.pageEnd ??
        (pageEnd >= entry.currentPage && !later ? entry.currentPage : 0);

      await tx.readingSession.create({
        data: {
          userId,
          bookId,
          readingId: active.id,
          date,
          pages: Math.max(0, pageEnd - startPage),
          minutes,
          pageEnd,
          note,
        },
      });
      if (!active.startedAt || date < active.startedAt) {
        await tx.reading.update({
          where: { id: active.id },
          data: { startedAt: date, startPrecision: "DAY" },
        });
      }
      if (!later) {
        await tx.userBook.update({
          where: { id: entry.id },
          data: { currentPage: pageEnd },
        });
      }
      return Boolean(book.pageCount && pageEnd >= book.pageCount);
    });
    refresh();
    return { reachedEnd };
  });
}

export async function updateProgress(
  bookId: string,
  input: { currentPage: number | string; startedAt: string; note?: string },
) {
  return withUser(async (userId) => {
    const book = await ensureBook(bookId);
    const currentPage = parsePage(input.currentPage, book.pageCount);
    const startedAt = parseDay(input.startedAt, "a data de início");
    const note = parseOptionalText(input.note, 500);
    await db.$transaction(async (tx) => {
      const entry = await shelfEntry(tx, userId, bookId);
      const active = await activeReading(tx, userId, bookId);
      if (!active) fail("Esse livro não está em leitura.");
      const firstSession = await tx.readingSession.findFirst({
        where: { readingId: active.id },
        orderBy: { date: "asc" },
      });
      if (firstSession && startedAt > firstSession.date)
        fail(
          `Você já registrou leitura em ${toISODay(firstSession.date).split("-").reverse().join("/")}. O início precisa ser antes disso.`,
        );
      await tx.reading.update({
        where: { id: active.id },
        data: { startedAt, startPrecision: "DAY" },
      });
      await tx.userBook.update({
        where: { id: entry.id },
        data: { currentPage, note },
      });
    });
    refresh();
  });
}

export async function toggleBookLike(bookId: string) {
  return withUser(async (userId) => {
    await ensureBook(bookId);
    const entry = await db.userBook.upsert({
      where: { userId_bookId: { userId, bookId } },
      create: { userId, bookId },
      update: {},
    });
    await db.userBook.update({
      where: { id: entry.id },
      data: entry.liked
        ? { liked: false, likedAt: null }
        : { liked: true, likedAt: new Date() },
    });
    refresh();
    return { liked: !entry.liked };
  });
}

export async function toggleFavorite(bookId: string) {
  return withUser(async (userId) => {
    await ensureBook(bookId);
    await db.$transaction(async (tx) => {
      const entry = await shelfEntry(tx, userId, bookId);
      if (entry.favoritePosition != null) {
        await tx.userBook.update({
          where: { id: entry.id },
          data: { favoritePosition: null },
        });
        await tx.userBook.updateMany({
          where: { userId, favoritePosition: { gt: entry.favoritePosition } },
          data: { favoritePosition: { decrement: 1 } },
        });
        return;
      }
      const count = await tx.userBook.count({
        where: { userId, favoritePosition: { not: null } },
      });
      if (count >= MAX_FAVORITES)
        fail(
          "Você já tem 5 favoritos. Tire um deles no seu perfil para abrir espaço.",
        );
      await tx.userBook.update({
        where: { id: entry.id },
        data: { favoritePosition: count + 1 },
      });
    });
    refresh();
  });
}

export async function saveFavorites(bookIds: string[]) {
  return withUser(async (userId) => {
    if (!Array.isArray(bookIds) || bookIds.length > MAX_FAVORITES)
      fail("Escolha até 5 favoritos.");
    const ids = [...new Set(bookIds.map(String))];
    await db.$transaction(async (tx) => {
      const current = await tx.userBook.findMany({
        where: { userId, favoritePosition: { not: null } },
        select: { bookId: true },
      });
      const allowed = new Set(current.map((c) => c.bookId));
      if (ids.some((id) => !allowed.has(id)))
        fail("Só dá para reordenar livros que já são favoritos.");
      await tx.userBook.updateMany({
        where: { userId, favoritePosition: { not: null } },
        data: { favoritePosition: null },
      });
      for (const [i, bookId] of ids.entries()) {
        await tx.userBook.update({
          where: { userId_bookId: { userId, bookId } },
          data: { favoritePosition: i + 1 },
        });
      }
    });
    refresh();
  });
}

export async function returnToPile(bookId: string) {
  return setShelfStatus(bookId, "WANT");
}

function parseDates(input: { startedAt?: string; finishedAt?: string }) {
  const start = parsePartial(input.startedAt, "a data de início");
  const end = parsePartial(input.finishedAt, "a data de término");
  if (start && end && start.date > periodEnd(end))
    fail("O início não pode ser depois do término.");
  return {
    startedAt: start?.date ?? null,
    startPrecision: start?.precision ?? "DAY",
    endedAt: end?.date ?? null,
    endPrecision: end?.precision ?? "DAY",
  } as const;
}

async function renumber(tx: Tx, userId: string, bookId: string) {
  const all = await tx.reading.findMany({ where: { userId, bookId } });
  const when = (r: (typeof all)[number]) =>
    (r.endedAt ?? r.startedAt ?? r.createdAt).getTime();
  const sorted = all.sort((a, b) => {
    if ((a.status === "ACTIVE") !== (b.status === "ACTIVE"))
      return a.status === "ACTIVE" ? 1 : -1;
    return when(a) - when(b);
  });
  for (const [i, r] of sorted.entries())
    if (r.number !== i + 1)
      await tx.reading.update({ where: { id: r.id }, data: { number: i + 1 } });
}

async function dropUnlinkedActivity(
  tx: Tx,
  userId: string,
  bookId: string,
  kind: "FINISHED" | "ABANDONED" | "STARTED",
) {
  const status = kind === "STARTED" ? undefined : kind;
  const [remaining, unlinked] = await Promise.all([
    tx.reading.count({ where: { userId, bookId, status } }),
    tx.activity.findMany({
      where: { userId, bookId, kind, readingId: null },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
  ]);
  const linked = await tx.activity.count({
    where: { userId, bookId, kind, readingId: { not: null } },
  });
  const extra = linked + unlinked.length - remaining;
  if (extra > 0)
    await tx.activity.deleteMany({
      where: { id: { in: unlinked.slice(0, extra).map((a) => a.id) } },
    });
}

async function ownReading(tx: Tx, userId: string, readingId: string) {
  const reading = await tx.reading.findUnique({ where: { id: readingId } });
  if (!reading || reading.userId !== userId) fail("Leitura não encontrada.");
  if (reading.status === "ACTIVE")
    fail("Essa leitura ainda está em andamento.");
  return reading;
}

export async function addPastReading(
  bookId: string,
  input: { startedAt?: string; finishedAt?: string },
) {
  return withUser(async (userId) => {
    const book = await ensureBook(bookId);
    const dates = parseDates(input);
    await db.$transaction(async (tx) => {
      const entry = await shelfEntry(tx, userId, bookId);
      await tx.reading.create({
        data: {
          userId,
          bookId,
          number: 0,
          status: "FINISHED",
          ...dates,
        },
      });
      await renumber(tx, userId, bookId);
      const status =
        entry.status === null || entry.status === "WANT"
          ? "READ"
          : entry.status === "READING"
            ? "REREADING"
            : entry.status;
      if (status !== entry.status)
        await tx.userBook.update({
          where: { id: entry.id },
          data: {
            status,
            statusChangedAt: new Date(),
            ...(status === "READ"
              ? { currentPage: book.pageCount ?? entry.currentPage }
              : {}),
          },
        });
    });
    refresh();
  });
}

export async function updateReading(
  readingId: string,
  input: { startedAt?: string; finishedAt?: string },
) {
  return withUser(async (userId) => {
    const dates = parseDates(input);
    await db.$transaction(async (tx) => {
      const reading = await ownReading(tx, userId, readingId);
      await tx.reading.update({
        where: { id: reading.id },
        data:
          reading.status === "ABANDONED"
            ? {
                startedAt: dates.startedAt,
                startPrecision: dates.startPrecision,
              }
            : dates,
      });
      await renumber(tx, userId, reading.bookId);
    });
    refresh();
  });
}

export async function deleteReading(readingId: string) {
  return withUser(async (userId) => {
    await db.$transaction(async (tx) => {
      const reading = await ownReading(tx, userId, readingId);
      const { bookId } = reading;
      await tx.reading.delete({ where: { id: reading.id } });
      if (reading.status !== "ACTIVE")
        await dropUnlinkedActivity(tx, userId, bookId, reading.status);
      await dropUnlinkedActivity(tx, userId, bookId, "STARTED");
      await renumber(tx, userId, bookId);
      const entry = await shelfEntry(tx, userId, bookId);
      const done = await finishedCount(tx, userId, bookId);
      if (done > 0) return;
      if (entry.status === "READ")
        await tx.userBook.update({
          where: { id: entry.id },
          data: { status: null, statusChangedAt: new Date(), currentPage: 0 },
        });
      else if (entry.status === "REREADING")
        await tx.userBook.update({
          where: { id: entry.id },
          data: { status: "READING" },
        });
    });
    refresh();
  });
}

export async function switchEdition(fromBookId: string, toBookId: string) {
  return withUser(async (userId) => {
    if (fromBookId === toBookId) return;
    await ensureBook(toBookId);
    const ids = await editionIds(toBookId);
    if (!ids.includes(fromBookId))
      fail("Essas edições não são do mesmo livro.");
    await db.$transaction(async (tx) => {
      const from = await tx.userBook.findUnique({
        where: { userId_bookId: { userId, bookId: fromBookId } },
      });
      if (!from) fail("Essa edição não está na sua estante.");
      const to = await tx.userBook.findUnique({
        where: { userId_bookId: { userId, bookId: toBookId } },
      });
      if (to?.status) fail("Esta edição já está na sua estante.");
      if (to) await tx.userBook.delete({ where: { id: to.id } });
      await tx.userBook.update({
        where: { id: from.id },
        data: { bookId: toBookId },
      });
      await tx.reading.updateMany({
        where: { userId, bookId: fromBookId },
        data: { bookId: toBookId },
      });
      await tx.readingSession.updateMany({
        where: { userId, bookId: fromBookId },
        data: { bookId: toBookId },
      });
      const hasReview = await tx.review.count({
        where: { userId, bookId: toBookId },
      });
      if (!hasReview)
        await tx.review.updateMany({
          where: { userId, bookId: fromBookId },
          data: { bookId: toBookId },
        });
      await tx.activity.updateMany({
        where: { userId, bookId: fromBookId },
        data: { bookId: toBookId },
      });
      const items = await tx.listItem.findMany({
        where: {
          bookId: fromBookId,
          list: { members: { some: { userId } } },
        },
        select: { id: true, listId: true },
      });
      for (const item of items) {
        const clash = await tx.listItem.count({
          where: { listId: item.listId, bookId: toBookId },
        });
        if (clash) await tx.listItem.delete({ where: { id: item.id } });
        else
          await tx.listItem.update({
            where: { id: item.id },
            data: { bookId: toBookId },
          });
      }
    });
    refresh();
  });
}
