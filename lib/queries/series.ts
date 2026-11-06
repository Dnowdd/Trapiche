import { cache } from "react";
import { db } from "../db";
import { bookSummarySelect, toCover } from "../books";
import { isAdmin } from "./reports";
import type { ShelfStatus } from "../generated/prisma/client";

type SeriesWorkRow = {
  position: number;
  workId: string;
  work: {
    title: string;
    books: {
      id: string;
      title: string;
      authors: string[];
      pageCount: number | null;
      coverUrl: string | null;
      publisher: string | null;
      language: string | null;
      _count: { shelf: number };
    }[];
  };
};

function pickEdition(row: SeriesWorkRow, preferId?: string) {
  const books = row.work.books;
  return (
    books.find((b) => b.id === preferId) ??
    [...books].sort(
      (a, b) =>
        Number(Boolean(b.coverUrl)) - Number(Boolean(a.coverUrl)) ||
        Number(b.language === "pt") - Number(a.language === "pt") ||
        b._count.shelf - a._count.shelf,
    )[0] ??
    null
  );
}

const worksInclude = {
  orderBy: { position: "asc" },
  include: {
    work: {
      select: {
        title: true,
        books: {
          select: {
            ...bookSummarySelect,
            language: true,
            _count: { select: { shelf: true } },
          },
        },
      },
    },
  },
} as const;

const loadSeries = cache(async (where: { slug: string } | { id: string }) =>
  db.series.findUnique({ where, include: { works: worksInclude } }),
);

async function viewerStatuses(viewerId: string | null, bookIds: string[]) {
  if (!viewerId || !bookIds.length) return new Map<string, ShelfStatus>();
  const rows = await db.userBook.findMany({
    where: { userId: viewerId, bookId: { in: bookIds }, status: { not: null } },
    select: { status: true, book: { select: { workId: true } } },
  });
  return new Map(
    rows
      .filter((r) => r.book.workId)
      .map((r) => [r.book.workId!, r.status!] as const),
  );
}

function shapeSeries(
  series: NonNullable<Awaited<ReturnType<typeof loadSeries>>>,
  statuses: Map<string, ShelfStatus>,
  currentWorkId?: string | null,
  currentBookId?: string,
) {
  const items = series.works.flatMap((w) => {
    const book = pickEdition(
      w,
      w.workId === currentWorkId ? currentBookId : undefined,
    );
    if (!book) return [];
    return [
      {
        position: w.position,
        workId: w.workId,
        book: toCover(book),
        status: statuses.get(w.workId) ?? null,
        current: w.workId === currentWorkId,
      },
    ];
  });
  const read = items.filter((i) => i.status === "READ").length;
  const next = items.find(
    (i) => i.status !== "READ" && i.status !== "ABANDONED",
  );
  return {
    id: series.id,
    name: series.name,
    slug: series.slug,
    description: series.description,
    items,
    total: items.length,
    read,
    next: read > 0 && next ? next : null,
  };
}

export async function getBookSeries(bookId: string, viewerId: string | null) {
  const book = await db.book.findUnique({
    where: { id: bookId },
    select: { workId: true },
  });
  const link = book?.workId
    ? await db.seriesWork.findFirst({
        where: { workId: book.workId },
        select: { seriesId: true },
      })
    : null;
  const canEdit = viewerId ? await isAdmin(viewerId) : false;
  if (!link) return canEdit && book?.workId ? { empty: true as const } : null;
  const series = await loadSeries({ id: link.seriesId });
  if (!series) return null;
  const statuses = await viewerStatuses(
    viewerId,
    series.works.flatMap((w) => w.work.books.map((b) => b.id)),
  );
  const shaped = shapeSeries(series, statuses, book!.workId, bookId);
  return {
    ...shaped,
    empty: false as const,
    canEdit,
    current: shaped.items.find((i) => i.current) ?? null,
  };
}

export type BookSeries = NonNullable<Awaited<ReturnType<typeof getBookSeries>>>;

export async function getSeriesPage(slug: string, viewerId: string | null) {
  const series = await loadSeries({ slug });
  if (!series) return null;
  const statuses = await viewerStatuses(
    viewerId,
    series.works.flatMap((w) => w.work.books.map((b) => b.id)),
  );
  return shapeSeries(series, statuses);
}

export type SeriesPage = NonNullable<Awaited<ReturnType<typeof getSeriesPage>>>;

export async function allSeriesSlugs() {
  return db.series.findMany({
    where: { works: { some: {} } },
    select: { slug: true, updatedAt: true },
  });
}
