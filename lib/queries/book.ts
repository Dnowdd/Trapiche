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
import { editionIds } from "../works";
import { cleanAuthor, groupWorks, normalize, workKey } from "../editions";
import {
  editionIdByIsbn,
  findOpenLibraryEditions,
  isOpenLibraryId,
  searchOpenLibraryPt,
  toIsbn13,
  withoutOpenLibraryDuplicates,
} from "../open-library";
import { findEditions, searchBooks } from "../google-books";
import {
  addDays,
  daysBetween,
  fmtAgo,
  fmtDayWeek,
  fmtExpected,
  fmtPartial,
  partialToISO,
  spanDays,
  streakFrom,
  today,
} from "../dates";
import type { ShelfStatus } from "../generated/prisma/client";
import type { GoogleBooksVolume } from "../types/book";

const ACTIVE_STATUSES: ShelfStatus[] = ["READ", "READING", "REREADING"];

import { initialsOf } from "../utils";

export { initialsOf };

async function latestReadingDays(bookIds: string[], userIds: string[]) {
  if (!userIds.length) return new Map<string, number>();
  const readings = await db.reading.findMany({
    where: {
      bookId: { in: bookIds },
      userId: { in: userIds },
      status: "FINISHED",
    },
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
  const ids = await editionIds(bookId);
  const where = {
    bookId: { in: ids },
    text: { not: null },
    hiddenAt: null,
    ...(opts.excludeViewer && viewerId ? { NOT: { userId: viewerId } } : {}),
  };
  const [rows, total] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
      take: opts.take,
      skip: opts.skip ?? 0,
      include: {
        user: { select: { name: true, handle: true, image: true } },
        book: { select: { publisher: true } },
        _count: { select: { likes: true, comments: true } },
        likes: viewerId
          ? { where: { userId: viewerId }, select: { userId: true } }
          : false,
      },
    }),
    db.review.count({ where }),
  ]);
  const days = await latestReadingDays(
    ids,
    rows.map((r) => r.userId),
  );
  return {
    total,
    items: rows.map((r) => ({
      id: r.id,
      user: r.user.name,
      handle: r.user.handle,
      initials: initialsOf(r.user.name),
      image: r.user.image,
      stars: r.rating,
      date: fmtAgo(r.createdAt),
      days: days.get(r.userId) ?? null,
      text: r.text ?? "",
      spoiler: r.spoiler,
      likes: r._count.likes,
      comments: r._count.comments,
      liked: Array.isArray(r.likes) && r.likes.length > 0,
      mine: r.userId === viewerId,
      edition:
        r.bookId === bookId ? null : (r.book.publisher ?? "outra edição"),
    })),
  };
}

export type ReviewItem = Awaited<
  ReturnType<typeof getReviews>
>["items"][number];

export async function relatedBooks(
  id: string,
  categories: string[],
  author: string | null,
) {
  const ids = await editionIds(id);
  const readers = await db.userBook.findMany({
    where: { bookId: { in: ids }, status: { in: ACTIVE_STATUSES } },
    select: { userId: true },
    take: 500,
  });
  let books: BookSummary[] = [];
  if (readers.length) {
    const groups = await db.userBook.groupBy({
      by: ["bookId"],
      where: {
        userId: { in: readers.map((r) => r.userId) },
        bookId: { notIn: ids },
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
    const queries: string[] = [];
    if (categories[0]) {
      const main = categories[0].split(" / ")[0];
      queries.push(`subject:"${main}"`);
    }
    if (author) queries.push(`author:"${author}"`);
    const seen = new Set([id, ...books.map((b) => b.id)]);
    const titles = new Set(books.map((b) => b.title.toLowerCase()));
    for (const query of queries) {
      if (books.length >= 10) break;
      const vols = await searchOpenLibraryPt(query, 20);
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

export async function byAuthor(
  id: string,
  title: string,
  author: string | null,
) {
  if (!author) return null;
  const key = normalize(cleanAuthor(author));
  const [google, openLibrary] = await Promise.all([
    searchBooks(`inauthor:"${author}"`, 40)
      .catch(() => [])
      .then(async (vols) =>
        vols.length ? vols : searchBooks(author, 40).catch(() => []),
      ),
    searchOpenLibraryPt(`author:"${author}"`, 40),
  ]);
  const current = workKey(title, author);
  const byThisAuthor = (v: GoogleBooksVolume) =>
    v.id !== id &&
    Boolean(v.volumeInfo.imageLinks) &&
    (v.volumeInfo.authors?.some((a) => normalize(cleanAuthor(a)) === key) ??
      false) &&
    normalize(v.volumeInfo.title) !== key &&
    workKey(v.volumeInfo.title, author) !== current;
  const fromOpen = groupWorks(openLibrary.filter(byThisAuthor), "")
    .map((w) => w.main)
    .slice(0, 10);
  const fromGoogle =
    fromOpen.length < 4
      ? withoutOpenLibraryDuplicates(fromOpen, google, author)
          .filter(byThisAuthor)
          .slice(0, 10 - fromOpen.length)
      : [];
  if (!fromOpen.length && !fromGoogle.length) return null;
  const items = await Promise.all(
    [...fromOpen, ...fromGoogle].map(async (v) => {
      const row = volumeToRow(v);
      return {
        cover: toCover({ ...row, coverUrl: await bestCover(row.coverUrl) }),
        year: row.publishedDate?.slice(0, 4) ?? null,
      };
    }),
  );
  return {
    author: cleanAuthor(author),
    items,
    fromGoogle: fromGoogle.length > 0,
  };
}

export async function editionsOf(book: BookData) {
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
  const googleRows: EditionRow[] = vols.map(volumeToRow);
  const storedRows: EditionRow[] = stored.filter(
    (r) => workKey(r.title, r.authors[0]) === key,
  );
  const rows = [...storedRows, ...googleRows];

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
  for (const r of [...fromOpenLibrary, ...storedRows, ...googleRows]) {
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
      fromGoogle: !isOpenLibraryId(row.id),
    })),
  );
}

type EditionRow = Omit<BookData, "syncedAt">;

export type EditionItem = Awaited<ReturnType<typeof editionsOf>>[number];

async function viewerState(
  bookId: string,
  viewerId: string,
  pageCount: number | null,
  ids: string[],
) {
  const [entry, active, closed, review, lists, others] = await Promise.all([
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
    db.reading.findMany({
      where: {
        userId: viewerId,
        bookId,
        status: { in: ["FINISHED", "ABANDONED"] },
      },
      orderBy: { number: "asc" },
    }),
    db.review.findFirst({
      where: { userId: viewerId, bookId: { in: ids } },
      orderBy: { updatedAt: "desc" },
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
    db.userBook.findMany({
      where: {
        userId: viewerId,
        bookId: { in: ids.filter((x) => x !== bookId) },
        status: { not: null },
      },
      select: {
        status: true,
        book: { select: { id: true, publisher: true, publishedDate: true } },
      },
    }),
  ]);

  const finished = closed.filter((r) => r.status === "FINISHED").length;

  let reading = null;
  if (active && entry) {
    const page = entry.currentPage;
    const total = pageCount ?? 0;
    const daily = active.sessions.filter((s) => s.datePrecision === "DAY");
    const paceFrom =
      active.startedAt ??
      active.sessions.reduce<Date | null>(
        (min, s) => (!min || s.date < min ? s.date : min),
        null,
      );
    const elapsed = paceFrom
      ? Math.max(1, daysBetween(paceFrom, today()) + 1)
      : 0;
    const pagesRead = Math.max(0, page);
    const pace = elapsed ? pagesRead / elapsed : 0;
    const remaining = Math.max(0, total - page);
    reading = {
      number: active.number,
      progress: total ? Math.min(100, Math.round((page / total) * 100)) : 0,
      page,
      total,
      started: fmtPartial(active.startedAt, active.startPrecision),
      startedPartial: partialToISO(active.startedAt, active.startPrecision),
      expectedDone:
        total && pace > 0
          ? fmtExpected(addDays(today(), Math.ceil(remaining / pace)))
          : null,
      streakDays: streakFrom(daily.map((s) => s.date)),
      sessions: active.sessions.slice(0, 5).map((s) => ({
        id: s.id,
        date:
          s.datePrecision === "DAY"
            ? fmtDayWeek(s.date)
            : fmtPartial(s.date, s.datePrecision)!,
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
    currentPage: entry?.currentPage ?? 0,
    timesRead: finished + (active ? 1 : 0),
    reading,
    readings: closed.map((r) => ({
      id: r.id,
      number: r.number,
      status: r.status,
      started: fmtPartial(r.startedAt, r.startPrecision),
      ended: fmtPartial(r.endedAt, r.endPrecision),
      startedPartial: partialToISO(r.startedAt, r.startPrecision),
      endedPartial: partialToISO(r.endedAt, r.endPrecision),
      days: spanDays(r),
    })),
    otherEditions: others.map((o) => ({
      id: o.book.id,
      status: o.status!,
      label: [o.book.publisher, o.book.publishedDate?.slice(0, 4)]
        .filter(Boolean)
        .join(" · "),
    })),
    review: review
      ? {
          rating: review.rating,
          text: review.text ?? "",
          spoiler: review.spoiler,
          hidden: review.hiddenAt != null,
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
  const ids = await editionIds(id);

  const [
    ratingGroups,
    finishedReadings,
    publicListsCount,
    communityLists,
    reviews,
    viewer,
  ] = await Promise.all([
    db.review.groupBy({
      by: ["rating"],
      where: { bookId: { in: ids } },
      _count: { rating: true },
    }),
    db.reading.findMany({
      where: {
        bookId: { in: ids },
        status: "FINISHED",
        startedAt: { not: null },
        endedAt: { not: null },
        startPrecision: "DAY",
        endPrecision: "DAY",
      },
    }),
    db.list.count({
      where: {
        visibility: "PUBLIC",
        items: { some: { bookId: { in: ids } } },
      },
    }),
    db.list.findMany({
      where: {
        visibility: "PUBLIC",
        items: { some: { bookId: { in: ids } } },
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
    viewerId ? viewerState(id, viewerId, book.pageCount, ids) : null,
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
    viewer,
  };
}

export async function openLibraryEquivalent(book: BookData) {
  if (isOpenLibraryId(book.id)) return null;
  const isbns = [toIsbn13(book.isbn13), toIsbn13(book.isbn10)].filter(
    (x): x is string => Boolean(x),
  );
  if (!isbns.length) return null;
  const [shelved, reviewed, listed] = await Promise.all([
    db.userBook.count({ where: { bookId: book.id } }),
    db.review.count({ where: { bookId: book.id } }),
    db.listItem.count({ where: { bookId: book.id } }),
  ]);
  if (shelved || reviewed || listed) return null;
  for (const isbn of [...new Set(isbns)]) {
    const id = await editionIdByIsbn(isbn, book.title).catch(() => null);
    if (id) return id;
  }
  return null;
}

export type BookPageData = NonNullable<Awaited<ReturnType<typeof getBookPage>>>;
export type ByAuthorData = Awaited<ReturnType<typeof byAuthor>>;
