import { db } from "../db";
import { bookSummarySelect, toCover } from "../books";
import { categoryLabels } from "../categories";
import { cleanAuthor } from "../editions";
import {
  dayOf,
  daysBetween,
  fmtDayShort,
  longestStreak,
  MONTHS_LONG,
  spanDays,
  today,
  toISODay,
} from "../dates";

function rangeOf(year: number, month?: number) {
  const from = new Date(Date.UTC(year, month ? month - 1 : 0, 1));
  const to = month
    ? new Date(Date.UTC(year, month, 1))
    : new Date(Date.UTC(year + 1, 0, 1));
  return { from, to };
}

function finishedWhere(userId: string, year: number, month?: number) {
  const { from, to } = rangeOf(year, month);
  return {
    userId,
    status: "FINISHED" as const,
    OR: [
      {
        endedAt: { gte: from, lt: to },
        ...(month ? { endPrecision: { not: "YEAR" as const } } : {}),
      },
      {
        endedAt: null,
        activities: {
          some: { kind: "FINISHED" as const, createdAt: { gte: from, lt: to } },
        },
      },
    ],
  };
}

export function finishedCount(userId: string, year: number) {
  return db.reading.count({ where: finishedWhere(userId, year) });
}

export async function getGoal(userId: string, year: number) {
  const [goal, done] = await Promise.all([
    db.readingGoal.findUnique({ where: { userId_year: { userId, year } } }),
    finishedCount(userId, year),
  ]);
  const now = today();
  const current = now.getUTCFullYear() === year;
  const { from, to } = rangeOf(year);
  const elapsed = current
    ? (daysBetween(from, now) + 1) / daysBetween(from, to)
    : year < now.getUTCFullYear()
      ? 1
      : 0;
  const target = goal?.target ?? null;
  const expected = target ? Math.floor(target * elapsed) : null;
  return {
    year,
    target,
    done,
    current,
    pct: target ? Math.min(100, Math.round((done / target) * 100)) : 0,
    pace: target && expected != null ? done - expected : null,
  };
}

export type GoalData = Awaited<ReturnType<typeof getGoal>>;

function top<T extends string>(values: T[], n: number) {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

function finishedOn(r: {
  endedAt: Date | null;
  activities: { createdAt: Date }[];
}) {
  return (
    r.endedAt ?? (r.activities[0] ? dayOf(r.activities[0].createdAt) : null)
  );
}

export async function getRetrospective(
  userId: string,
  year: number,
  month?: number,
) {
  const { from, to } = rangeOf(year, month);
  const [readings, sessions, abandoned, reviewsWritten, first, goal] =
    await Promise.all([
      db.reading.findMany({
        where: finishedWhere(userId, year, month),
        include: {
          book: { select: { ...bookSummarySelect, categories: true } },
          activities: {
            where: { kind: "FINISHED" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
          _count: { select: { sessions: true } },
        },
      }),
      db.readingSession.findMany({
        where: { userId, date: { gte: from, lt: to } },
        select: {
          date: true,
          pages: true,
          minutes: true,
          book: { select: bookSummarySelect },
        },
      }),
      db.reading.count({
        where: {
          userId,
          status: "ABANDONED",
          endedAt: { gte: from, lt: to },
        },
      }),
      db.review.count({
        where: { userId, createdAt: { gte: from, lt: to } },
      }),
      db.reading.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, startedAt: true, endedAt: true },
      }),
      month ? Promise.resolve(null) : getGoal(userId, year),
    ]);

  const bookIds = [...new Set(readings.map((r) => r.bookId))];
  const ratings = new Map(
    (
      await db.review.findMany({
        where: { userId, bookId: { in: bookIds } },
        select: { bookId: true, rating: true },
      })
    ).map((r) => [r.bookId, r.rating]),
  );

  const books = readings
    .map((r) => ({
      reading: r,
      date: finishedOn(r),
      rating: ratings.get(r.bookId) ?? null,
      days: spanDays(r),
    }))
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const unloggedPages = (list: typeof books) =>
    list.reduce(
      (s, b) =>
        s + (b.reading._count.sessions ? 0 : (b.reading.book.pageCount ?? 0)),
      0,
    );
  const pages =
    sessions.reduce((s, x) => s + x.pages, 0) + unloggedPages(books);
  const minutes = sessions.reduce((s, x) => s + x.minutes, 0);
  const sessionDays = sessions.map((s) => s.date);
  const readingDays = new Set(sessionDays.map(toISODay)).size;

  const byBookMinutes = new Map<
    string,
    { minutes: number; book: (typeof sessions)[number]["book"] }
  >();
  for (const s of sessions) {
    const cur = byBookMinutes.get(s.book.id);
    byBookMinutes.set(s.book.id, {
      book: s.book,
      minutes: (cur?.minutes ?? 0) + s.minutes,
    });
  }
  const mostTime = [...byBookMinutes.values()].sort(
    (a, b) => b.minutes - a.minutes,
  )[0];

  const rated = books.filter((b) => b.rating != null);
  const favorite = rated.sort((a, b) => b.rating! - a.rating!)[0] ?? null;
  const longest =
    [...books].sort(
      (a, b) =>
        (b.reading.book.pageCount ?? 0) - (a.reading.book.pageCount ?? 0),
    )[0] ?? null;
  const fastest =
    books.filter((b) => b.days != null).sort((a, b) => a.days! - b.days!)[0] ??
    null;

  const months = month
    ? null
    : MONTHS_LONG.map((name, i) => {
        const inMonth = books.filter(
          (b) =>
            b.date &&
            b.date.getUTCMonth() === i &&
            !(b.reading.endedAt && b.reading.endPrecision === "YEAR"),
        );
        const monthSessions = sessions.filter(
          (s) => s.date.getUTCMonth() === i,
        );
        return {
          month: i + 1,
          name,
          books: inMonth.length,
          pages:
            monthSessions.reduce((s, x) => s + x.pages, 0) +
            unloggedPages(inMonth),
          minutes: monthSessions.reduce((s, x) => s + x.minutes, 0),
          covers: inMonth.slice(0, 3).map((b) => toCover(b.reading.book)),
        };
      });

  const now = today();
  const startYear = first
    ? Math.min(
        ...[first.createdAt, first.startedAt, first.endedAt]
          .filter((d): d is Date => d != null)
          .map((d) => d.getUTCFullYear()),
      )
    : now.getUTCFullYear();

  const pick = (b: (typeof books)[number] | null, extra?: string) =>
    b
      ? {
          book: toCover(b.reading.book),
          rating: b.rating,
          detail: extra ?? null,
        }
      : null;

  return {
    year,
    month: month ?? null,
    label: month ? `${MONTHS_LONG[month - 1]} de ${year}` : String(year),
    years: Array.from(
      { length: now.getUTCFullYear() - startYear + 1 },
      (_, i) => now.getUTCFullYear() - i,
    ),
    lastMonth:
      year === now.getUTCFullYear()
        ? now.getUTCMonth() + 1
        : year < now.getUTCFullYear()
          ? 12
          : 0,
    totals: {
      books: books.length,
      pages,
      minutes,
      readingDays,
      streak: longestStreak(sessionDays).length,
      abandoned,
      reviews: reviewsWritten,
      rereads: books.filter((b) => b.reading.number > 1).length,
    },
    books: books.map((b) => ({
      ...toCover(b.reading.book),
      rating: b.rating,
      when:
        b.date && !(b.reading.endedAt && b.reading.endPrecision !== "DAY")
          ? fmtDayShort(b.date)
          : null,
      reread: b.reading.number > 1,
    })),
    authors: top(
      books.flatMap((b) =>
        b.reading.book.authors[0]
          ? [cleanAuthor(b.reading.book.authors[0])]
          : [],
      ),
      3,
    ),
    genres: top(
      books.flatMap((b) => categoryLabels(b.reading.book.categories)),
      3,
    ),
    highlights: {
      favorite: pick(favorite),
      mostTime: mostTime
        ? {
            book: toCover(mostTime.book),
            rating: ratings.get(mostTime.book.id) ?? null,
            detail: fmtMinutes(mostTime.minutes),
          }
        : null,
      longest: longest?.reading.book.pageCount
        ? pick(
            longest,
            `${longest.reading.book.pageCount.toLocaleString("pt-BR")} páginas`,
          )
        : null,
      fastest: fastest
        ? pick(
            fastest,
            `${fastest.days} ${fastest.days === 1 ? "dia" : "dias"}`,
          )
        : null,
    },
    months,
    goal,
  };
}

export type Retrospective = Awaited<ReturnType<typeof getRetrospective>>;

export function fmtMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}
