import { db } from "../db";
import {
  bookSummarySelect,
  languageLabel,
  loadBook,
  toCover,
  volumeToRow,
  type BookData,
  type BookSummary,
} from "../books";
import { bestCover } from "../cover-probe";
import { workKey } from "../editions";
import { findOpenLibraryEditions, toIsbn13 } from "../open-library";
import { findEditions, searchBooks } from "../google-books";
import {
  addDays,
  dayOf,
  daysBetween,
  fmtAgo,
  fmtDayWeek,
  fmtExpected,
  fmtPartial,
  partialToISO,
  spanDays,
  streakFrom,
  today,
  toISODay,
} from "../dates";
import type { ShelfStatus } from "../generated/prisma/client";

const ACTIVE_STATUSES: ShelfStatus[] = ["READ", "READING", "REREADING"];

export function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

async function latestReadingDays(bookId: string, userIds: string[]) {
  if (!userIds.length) return new Map<string, number>();
  const readings = await db.reading.findMany({
    where: { bookId, userId: { in: userIds }, status: "FINISHED" },
    orderBy: { endedAt: "desc" },
  });
  const map = new Map<string, number>();
  for (const r of readings) {
    if (map.has(r.userId)) continue;
    const days = spanDays(r);
    if (days != null) map.set(r.userId, days);
  }
  return map;
}

export async function getReviews(
  bookId: string,
  viewerId: string | null,
  opts: { take: number; skip?: number; excludeViewer?: boolean },
) {
  const where = {
    bookId,
    text: { not: null },
    ...(opts.excludeViewer && viewerId ? { NOT: { userId: viewerId } } : {}),
  };
  const [rows, total] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
      take: opts.take,
      skip: opts.skip ?? 0,
      include: {
        user: { select: { name: true, handle: true } },
        _count: { select: { likes: true, comments: true } },
        likes: viewerId
          ? { where: { userId: viewerId }, select: { userId: true } }
          : false,
      },
    }),
    db.review.count({ where }),
  ]);
  const days = await latestReadingDays(
    bookId,
    rows.map((r) => r.userId),
  );
  return {
    total,
    items: rows.map((r) => ({
      id: r.id,
      user: r.user.name,
      handle: r.user.handle,
      initials: initialsOf(r.user.name),
      stars: r.rating,
      date: fmtAgo(r.createdAt),
      days: days.get(r.userId) ?? null,
      text: r.text ?? "",
      likes: r._count.likes,
      comments: r._count.comments,
      liked: Array.isArray(r.likes) && r.likes.length > 0,
      mine: r.userId === viewerId,
    })),
  };
}

export type ReviewItem = Awaited<
  ReturnType<typeof getReviews>
>["items"][number];

async function relatedBooks(
  id: string,
  categories: string[],
  author: string | null,
  language: string | null,
) {
  const readers = await db.userBook.findMany({
    where: { bookId: id, status: { in: ACTIVE_STATUSES } },
    select: { userId: true },
    take: 500,
  });
  let books: BookSummary[] = [];
  if (readers.length) {
    const groups = await db.userBook.groupBy({
      by: ["bookId"],
      where: {
        userId: { in: readers.map((r) => r.userId) },
        bookId: { not: id },
        status: { in: ACTIVE_STATUSES },
      },
      _count: { bookId: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 10,
    });
    const rows = await db.book.findMany({
      where: { id: { in: groups.map((g) => g.bookId) } },
      select: bookSummarySelect,
    });
    books = groups
      .map((g) => rows.find((r) => r.id === g.bookId))
      .filter((b): b is BookSummary => Boolean(b));
  }
  if (books.length < 10) {
    const queries: [string, string | undefined][] = [];
    if (categories[0]) {
      queries.push([`subject:"${categories[0]}"`, undefined]);
      const main = categories[0].split(" / ")[0];
      if (main !== categories[0])
        queries.push([`subject:"${main}"`, language ?? undefined]);
    }
    if (author) queries.push([`inauthor:"${author}"`, undefined]);
    const seen = new Set([id, ...books.map((b) => b.id)]);
    const titles = new Set(books.map((b) => b.title.toLowerCase()));
    for (const [query, lang] of queries) {
      if (books.length >= 10) break;
      const vols = await searchBooks(query, 20, lang).catch(() => []);
      for (const v of vols) {
        if (books.length >= 10) break;
        const row = volumeToRow(v);
        if (seen.has(row.id) || titles.has(row.title.toLowerCase())) continue;
        if (!row.coverUrl) continue;
        seen.add(row.id);
        titles.add(row.title.toLowerCase());
        books.push(row);
      }
    }
  }
  return Promise.all(
    books.map(async (b) =>
      toCover({ ...b, coverUrl: await bestCover(b.coverUrl) }),
    ),
  );
}

async function byAuthor(id: string, title: string, author: string | null) {
  if (!author) return null;
  let vols = await searchBooks(`inauthor:"${author}"`, 20).catch(() => []);
  if (!vols.length) vols = await searchBooks(author, 20).catch(() => []);
  const seen = new Set([workKey(title, author)]);
  const items: { id: string; title: string; year: string | null }[] = [];
  for (const v of vols) {
    const t = v.volumeInfo.title;
    const key = workKey(t, author);
    if (v.id === id || seen.has(key)) continue;
    if (!v.volumeInfo.authors?.includes(author)) continue;
    seen.add(key);
    items.push({
      id: v.id,
      title: t,
      year: v.volumeInfo.publishedDate?.slice(0, 4) ?? null,
    });
    if (items.length >= 5) break;
  }
  if (!items.length) return null;
  return { author, items };
}

async function editionsOf(book: BookData) {
  const { id, title } = book;
  const author = book.authors[0];
  const [vols, stored] = await Promise.all([
    findEditions(id, title, author).catch(() => []),
    author
      ? db.book.findMany({
          where: {
            id: { not: id },
            authors: { has: author },
            publisher: { not: null },
          },
          take: 100,
        })
      : [],
  ]);
  const key = workKey(title, author);
  const rows: EditionRow[] = vols.map(volumeToRow);
  for (const r of stored)
    if (workKey(r.title, r.authors[0]) === key) rows.push(r);

  const isbnsOf = (r: EditionRow) =>
    [toIsbn13(r.isbn13), toIsbn13(r.isbn10)].filter((x): x is string =>
      Boolean(x),
    );
  const known = [book, ...rows].flatMap(isbnsOf);
  const fromOpenLibrary = await findOpenLibraryEditions({
    title,
    author,
    isbns: [...new Set(known)],
  }).catch(() => []);

  const seenIds = new Set([id]);
  const seenIsbns = new Set(isbnsOf(book));
  const merged: EditionRow[] = [];
  for (const r of [...rows, ...fromOpenLibrary]) {
    const isbns = isbnsOf(r);
    if (seenIds.has(r.id) || isbns.some((i) => seenIsbns.has(i))) continue;
    seenIds.add(r.id);
    isbns.forEach((i) => seenIsbns.add(i));
    merged.push(r);
  }

  return Promise.all(
    merged.slice(0, 12).map(async (row) => ({
      cover: toCover({ ...row, coverUrl: await bestCover(row.coverUrl) }),
      publisher: row.publisher,
      year: row.publishedDate?.slice(0, 4) ?? null,
      pages: row.pageCount,
      language: languageLabel(row.language),
    })),
  );
}

type EditionRow = Omit<BookData, "syncedAt">;

export type EditionItem = Awaited<ReturnType<typeof editionsOf>>[number];

async function viewerState(
  bookId: string,
  viewerId: string,
  pageCount: number | null,
) {
  const [entry, active, finished, review, lists] = await Promise.all([
    db.userBook.findUnique({
      where: { userId_bookId: { userId: viewerId, bookId } },
    }),
    db.reading.findFirst({
      where: { userId: viewerId, bookId, status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
      include: {
        sessions: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
      },
    }),
    db.reading.count({
      where: { userId: viewerId, bookId, status: "FINISHED" },
    }),
    db.review.findUnique({
      where: { userId_bookId: { userId: viewerId, bookId } },
    }),
    db.list.findMany({
      where: { members: { some: { userId: viewerId } } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        visibility: true,
        ownerId: true,
        _count: { select: { items: true } },
        items: { where: { bookId }, select: { id: true } },
      },
    }),
  ]);

  let reading = null;
  if (active && entry) {
    const page = entry.currentPage;
    const total = pageCount ?? 0;
    const startedAt = active.startedAt ?? dayOf(active.createdAt);
    const elapsed = Math.max(1, daysBetween(startedAt, today()) + 1);
    const pagesRead = Math.max(0, page);
    const pace = pagesRead / elapsed;
    const remaining = Math.max(0, total - page);
    reading = {
      number: active.number,
      progress: total ? Math.min(100, Math.round((page / total) * 100)) : 0,
      page,
      total,
      started: fmtPartial(startedAt, active.startPrecision)!,
      startedISO: toISODay(startedAt),
      startedPartial: partialToISO(active.startedAt, active.startPrecision),
      expectedDone:
        total && pace > 0
          ? fmtExpected(addDays(today(), Math.ceil(remaining / pace)))
          : null,
      streakDays: streakFrom(active.sessions.map((s) => s.date)),
      sessions: active.sessions.slice(0, 5).map((s) => ({
        id: s.id,
        date: fmtDayWeek(s.date),
        pages: s.pages,
        minutes: s.minutes,
        pageEnd: s.pageEnd,
      })),
      sessionsCount: active.sessions.length,
    };
  }

  return {
    status: entry?.status ?? null,
    liked: entry?.liked ?? false,
    favorite: entry?.favoritePosition != null,
    note: entry?.note ?? null,
    currentPage: entry?.currentPage ?? 0,
    timesRead: finished + (active ? 1 : 0),
    reading,
    review: review
      ? {
          rating: review.rating,
          text: review.text ?? "",
          date: fmtAgo(review.createdAt),
        }
      : null,
    lists: lists.map((l) => ({
      id: l.id,
      title: l.title,
      visibility: l.visibility,
      mine: l.ownerId === viewerId,
      count: l._count.items,
      hasBook: l.items.length > 0,
    })),
  };
}

export async function getBookPage(id: string, viewerId: string | null) {
  const book = await loadBook(id);
  if (!book) return null;
  const author = book.authors[0] ?? null;

  const [
    ratingGroups,
    finishedReadings,
    publicListsCount,
    communityLists,
    reviews,
    related,
    authorBlock,
    editions,
    viewer,
  ] = await Promise.all([
    db.review.groupBy({
      by: ["rating"],
      where: { bookId: id },
      _count: { rating: true },
    }),
    db.reading.findMany({
      where: {
        bookId: id,
        status: "FINISHED",
        startedAt: { not: null },
        endedAt: { not: null },
        startPrecision: "DAY",
        endPrecision: "DAY",
      },
    }),
    db.list.count({
      where: { visibility: "PUBLIC", items: { some: { bookId: id } } },
    }),
    db.list.findMany({
      where: {
        visibility: "PUBLIC",
        items: { some: { bookId: id } },
        ...(viewerId ? { members: { none: { userId: viewerId } } } : {}),
      },
      orderBy: [{ followers: { _count: "desc" } }, { updatedAt: "desc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        owner: { select: { name: true } },
        _count: { select: { items: true, followers: true } },
      },
    }),
    getReviews(id, viewerId, { take: 4, excludeViewer: true }),
    relatedBooks(id, book.categories, author, book.language),
    byAuthor(id, book.title, author),
    editionsOf(book),
    viewerId ? viewerState(id, viewerId, book.pageCount) : null,
  ]);

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let ratingSum = 0;
  for (const g of ratingGroups) {
    const bucket = Math.max(1, Math.floor(g.rating)) as 1 | 2 | 3 | 4 | 5;
    distribution[bucket] += g._count.rating;
    ratingSum += g.rating * g._count.rating;
  }
  const count = Object.values(distribution).reduce((a, b) => a + b, 0);
  const average = count ? ratingSum / count : 0;
  const avgDaysToRead = finishedReadings.length
    ? Math.round(
        finishedReadings.reduce((s, r) => s + (spanDays(r) ?? 0), 0) /
          finishedReadings.length,
      )
    : null;

  const myListsWithBook = viewer?.lists.filter((l) => l.hasBook) ?? [];
  const communityTotal = viewerId
    ? await db.list.count({
        where: {
          visibility: "PUBLIC",
          items: { some: { bookId: id } },
          members: { none: { userId: viewerId } },
        },
      })
    : publicListsCount;

  return {
    book: { ...book, cover: toCover(book) },
    languageLabel: languageLabel(book.language),
    rating: { average, count, distribution, avgDaysToRead, publicListsCount },
    reviews,
    lists: {
      total: myListsWithBook.length + communityTotal,
      mine: myListsWithBook,
      community: communityLists.map((l) => ({
        id: l.id,
        title: l.title,
        by: l.owner.name,
        count: l._count.items,
        followers: l._count.followers,
      })),
    },
    related,
    byAuthor: authorBlock,
    editions,
    viewer,
  };
}

export type BookPageData = NonNullable<Awaited<ReturnType<typeof getBookPage>>>;
