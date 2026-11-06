import { db } from "../db";
import { languageLabel } from "../books";
import { MONTHS_LONG } from "../dates";
import { finishedWhere, rangeOf } from "./stats";

export interface Share {
  label: string;
  count: number;
  percent: number;
}

function shares(values: string[], limit = 5): Share[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const total = values.length || 1;
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit).reduce((a, [, n]) => a + n, 0);
  const rows = top.map(([label, count]) => ({
    label,
    count,
    percent: Math.round((count / total) * 100),
  }));
  if (rest)
    rows.push({
      label: "Outros",
      count: rest,
      percent: Math.round((rest / total) * 100),
    });
  return rows;
}

const FORMAT: Record<string, string> = {
  PRINT: "Físico",
  EBOOK: "E-book",
  AUDIO: "Audiolivro",
};

export async function getRetroStats(
  userId: string,
  year: number,
  month?: number,
) {
  const { from, to } = rangeOf(year, month);
  const [readings, sessions] = await Promise.all([
    db.reading.findMany({
      where: finishedWhere(userId, year, month),
      select: {
        bookId: true,
        book: {
          select: { language: true, publishedDate: true, pageCount: true },
        },
      },
    }),
    month
      ? Promise.resolve([])
      : db.readingSession.findMany({
          where: { userId, date: { gte: from, lt: to } },
          select: { date: true, pages: true, minutes: true },
        }),
  ]);
  const bookIds = [...new Set(readings.map((r) => r.bookId))];
  const [reviews, entries] = await Promise.all([
    db.review.findMany({
      where: { userId, bookId: { in: bookIds } },
      select: { rating: true },
    }),
    db.userBook.findMany({
      where: { userId, bookId: { in: bookIds } },
      select: { format: true },
    }),
  ]);

  const byMonth = Array.from({ length: 12 }, (_, i) => ({
    label: MONTHS_LONG[i].slice(0, 3),
    month: MONTHS_LONG[i],
    pages: 0,
    minutes: 0,
  }));
  for (const s of sessions) {
    const m = byMonth[s.date.getUTCMonth()];
    m.pages += s.pages;
    m.minutes += s.minutes;
  }

  const ratings = [1, 2, 3, 4, 5].map((stars) => ({
    stars,
    count: reviews.filter((r) => Math.ceil(r.rating) === stars).length,
  }));
  const average = reviews.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : null;

  const decades = readings.flatMap((r) => {
    const y = Number(r.book.publishedDate?.slice(0, 4));
    return Number.isFinite(y) && y > 1000
      ? [`Anos ${Math.floor(y / 10) * 10}`]
      : [];
  });
  const pageCounts = readings
    .map((r) => r.book.pageCount ?? 0)
    .filter((p) => p > 0);

  return {
    byMonth: month ? null : byMonth,
    ratings,
    average,
    rated: reviews.length,
    languages: shares(
      readings.flatMap((r) =>
        r.book.language
          ? [languageLabel(r.book.language) ?? r.book.language]
          : [],
      ),
    ),
    formats: shares(entries.map((e) => FORMAT[e.format] ?? e.format)),
    decades: shares(decades, 4),
    averagePages: pageCounts.length
      ? Math.round(pageCounts.reduce((a, p) => a + p, 0) / pageCounts.length)
      : null,
  };
}

export type RetroStats = Awaited<ReturnType<typeof getRetroStats>>;
