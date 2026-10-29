import { db } from "../db";
import { bookSummarySelect, toCover } from "../books";
import {
  addDays,
  daysBetween,
  dayOf,
  fmtAgo,
  fmtDay,
  fmtDayShort,
  fmtDayWeek,
  fmtExpected,
  fmtJoined,
  fmtMonthYear,
  longestStreak,
  readingDays,
  spanDays,
  streakFrom,
  today,
  toISODay,
  WEEKDAYS_LONG,
} from "../dates";
import { initialsOf } from "./book";
import { byLine } from "./lists";
import type { Prisma, ShelfStatus } from "../generated/prisma/client";

export const TABS = [
  "inicio",
  "estante",
  "diario",
  "avaliacoes",
  "listas",
  "curtidas",
  "abandonos",
  "releituras",
] as const;
export type Tab = (typeof TABS)[number];

export const SHELF_LABEL: Record<ShelfStatus, string> = {
  READING: "Lendo",
  WANT: "Quero ler",
  READ: "Lido",
  REREADING: "Relendo",
  ABANDONED: "Abandonado",
};

function listsWhereForProfile(
  userId: string,
  viewerId: string | null,
): Prisma.ListWhereInput {
  const memberOfProfile = { members: { some: { userId } } };
  if (viewerId === userId) return memberOfProfile;
  return {
    AND: [
      memberOfProfile,
      viewerId
        ? {
            OR: [
              { visibility: "PUBLIC" },
              { members: { some: { userId: viewerId } } },
            ],
          }
        : { visibility: "PUBLIC" },
    ],
  };
}

async function rereadBookIds(userId: string) {
  const groups = await db.reading.groupBy({
    by: ["bookId"],
    where: { userId, status: { in: ["FINISHED", "ACTIVE"] } },
    _count: { bookId: true },
  });
  return groups.filter((g) => g._count.bookId >= 2).map((g) => g.bookId);
}

export async function getProfile(handle: string, viewerId: string | null) {
  const user = await db.user.findUnique({
    where: { handle },
    select: {
      id: true,
      name: true,
      handle: true,
      bio: true,
      city: true,
      createdAt: true,
    },
  });
  if (!user) return null;
  const userId = user.id;

  const [byStatus, reviews, sessions, lists, likes, rereads] =
    await Promise.all([
      db.userBook.groupBy({
        by: ["status"],
        where: { userId, status: { not: null } },
        _count: { status: true },
      }),
      db.review.count({ where: { userId } }),
      db.readingSession.count({ where: { userId } }),
      db.list.count({ where: listsWhereForProfile(userId, viewerId) }),
      db.userBook.count({ where: { userId, liked: true } }),
      rereadBookIds(userId),
    ]);

  const count = (s: ShelfStatus) =>
    byStatus.find((g) => g.status === s)?._count.status ?? 0;
  const shelfTotal = byStatus.reduce((a, g) => a + g._count.status, 0);

  return {
    user: {
      ...user,
      initials: initialsOf(user.name),
      joined: fmtJoined(user.createdAt),
    },
    isOwner: viewerId === userId,
    loggedIn: viewerId != null,
    stats: [
      {
        value: count("READ"),
        label: "concluídos",
        href: "estante&status=READ",
      },
      {
        value: count("READING"),
        label: "lendo",
        href: "estante&status=READING",
      },
      { value: count("WANT"), label: "quero ler", href: "estante&status=WANT" },
      {
        value: count("REREADING"),
        label: "relendo",
        href: "estante&status=REREADING",
      },
      { value: count("ABANDONED"), label: "abandonei", href: "abandonos" },
      { value: reviews, label: "resenhas", href: "avaliacoes" },
    ],
    counts: {
      inicio: null,
      estante: shelfTotal,
      diario: sessions,
      avaliacoes: reviews,
      listas: lists,
      curtidas: likes,
      abandonos: count("ABANDONED"),
      releituras: rereads.length,
    } satisfies Record<Tab, number | null>,
  };
}

export type ProfileData = NonNullable<Awaited<ReturnType<typeof getProfile>>>;

export async function getReadingNow(userId: string) {
  const rows = await db.userBook.findMany({
    where: { userId, status: { in: ["READING", "REREADING"] } },
    orderBy: { statusChangedAt: "desc" },
    include: { book: { select: bookSummarySelect } },
  });
  const readings = await db.reading.findMany({
    where: {
      userId,
      status: "ACTIVE",
      bookId: { in: rows.map((r) => r.bookId) },
    },
  });
  return rows.map((r) => {
    const reading = readings.find((x) => x.bookId === r.bookId);
    const total = r.book.pageCount ?? 0;
    const started = reading?.startedAt ?? today();
    const elapsed = Math.max(1, daysBetween(started, today()) + 1);
    const pace = r.currentPage / elapsed;
    return {
      book: toCover(r.book),
      currentPage: r.currentPage,
      pageCount: r.book.pageCount,
      progress: total
        ? Math.min(100, Math.round((r.currentPage / total) * 100))
        : 0,
      page: r.currentPage,
      total,
      started: fmtDayShort(started),
      expected:
        total && pace > 0
          ? fmtExpected(
              addDays(
                today(),
                Math.ceil(Math.max(0, total - r.currentPage) / pace),
              ),
            )
          : "sem previsão",
    };
  });
}

export async function getInicio(
  userId: string,
  viewerId: string | null,
  limit: number,
) {
  const visibleLists = listsWhereForProfile(userId, viewerId);
  const [favorites, readingNow, activity] = await Promise.all([
    db.userBook.findMany({
      where: { userId, favoritePosition: { not: null } },
      orderBy: { favoritePosition: "asc" },
      include: { book: { select: bookSummarySelect } },
    }),
    getReadingNow(userId),
    db.activity.findMany({
      where: {
        userId,
        OR: [{ listId: null }, { list: visibleLists }],
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: {
        book: { select: bookSummarySelect },
        review: { select: { spoiler: true, hiddenAt: true } },
        list: {
          select: {
            title: true,
            id: true,
            _count: { select: { items: true } },
          },
        },
      },
    }),
  ]);
  return {
    favorites: favorites.map((f) => toCover(f.book)),
    readingNow,
    activity: activity.slice(0, limit).map((a) => ({
      id: a.id,
      kind: a.kind,
      when: fmtAgo(a.createdAt),
      book: a.book ? toCover(a.book) : null,
      list: a.list
        ? { id: a.list.id, title: a.list.title, count: a.list._count.items }
        : null,
      rating: a.rating,
      text: a.review?.hiddenAt ? null : a.text,
      spoiler: a.review?.spoiler ?? false,
      days: a.days,
    })),
    hasMoreActivity: activity.length > limit,
  };
}

export async function getEstante(userId: string) {
  const rows = await db.userBook.findMany({
    where: { userId, status: { not: null } },
    orderBy: { statusChangedAt: "desc" },
    include: { book: { select: bookSummarySelect } },
  });
  return rows.map((r) => ({
    book: toCover(r.book),
    status: r.status!,
    since: r.statusChangedAt ? fmtAgo(r.statusChangedAt) : null,
    progress:
      r.book.pageCount && (r.status === "READING" || r.status === "REREADING")
        ? Math.min(100, Math.round((r.currentPage / r.book.pageCount) * 100))
        : null,
  }));
}

export async function getDiario(userId: string, entriesLimit: number) {
  const now = today();
  const year = now.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const lastYearStart = new Date(Date.UTC(year - 1, 0, 1));

  const [sessions, finished, entries, entriesTotal] = await Promise.all([
    db.readingSession.findMany({
      where: { userId },
      select: { date: true, minutes: true, pages: true },
    }),
    db.reading.findMany({
      where: { userId, status: "FINISHED", endedAt: { not: null } },
      select: {
        startedAt: true,
        startPrecision: true,
        endedAt: true,
        endPrecision: true,
        book: { select: bookSummarySelect },
      },
    }),
    db.readingSession.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: entriesLimit,
      include: { book: { select: bookSummarySelect } },
    }),
    db.readingSession.count({ where: { userId } }),
  ]);

  const minutesByDay: Record<string, number> = {};
  for (const s of sessions) {
    const k = toISODay(s.date);
    minutesByDay[k] = (minutesByDay[k] ?? 0) + s.minutes;
  }

  const inYear = (d: Date, start: Date) =>
    d >= start && d < new Date(Date.UTC(start.getUTCFullYear() + 1, 0, 1));
  const summarize = (start: Date) => {
    const ss = sessions.filter((s) => inYear(s.date, start));
    const fs = finished.filter((f) => inYear(f.endedAt!, start));
    const spans = fs.map(spanDays).filter((d): d is number => d != null);
    const minutes = ss.reduce((a, s) => a + s.minutes, 0);
    const isCurrent = start.getUTCFullYear() === year;
    const first = ss.reduce<Date | null>(
      (min, x) => (!min || x.date < min ? x.date : min),
      null,
    );
    const until = isCurrent
      ? addDays(now, 1)
      : new Date(Date.UTC(start.getUTCFullYear() + 1, 0, 1));
    const daysInPeriod = Math.max(1, daysBetween(first ?? start, until));
    return {
      year: start.getUTCFullYear(),
      books: fs.length,
      pages: ss.reduce((a, s) => a + s.pages, 0),
      hours: Math.round(minutes / 60),
      avgPerDay: Math.round(minutes / daysInPeriod),
      avgPerBook: spans.length
        ? Math.round(spans.reduce((a, d) => a + d, 0) / spans.length)
        : null,
    };
  };

  const byWeekday = Array.from({ length: 7 }, () => ({ minutes: 0, days: 0 }));
  for (const [iso, minutes] of Object.entries(minutesByDay)) {
    const wd = new Date(`${iso}T00:00:00Z`).getUTCDay();
    byWeekday[wd].minutes += minutes;
    byWeekday[wd].days += 1;
  }
  const busiestIdx = byWeekday.reduce(
    (best, w, i) =>
      w.days && w.minutes / w.days > (best.avg ?? 0)
        ? { i, avg: w.minutes / w.days }
        : best,
    { i: -1, avg: 0 } as { i: number; avg: number },
  );

  const withDays = finished.flatMap((f) => {
    const days = spanDays(f);
    return days == null ? [] : [{ title: f.book.title, days }];
  });
  const sortedByDays = [...withDays].sort((a, b) => a.days - b.days);

  const sessionDays = Object.keys(minutesByDay).map(
    (k) => new Date(`${k}T00:00:00Z`),
  );
  const years = [
    ...new Set([year, ...sessionDays.map((d) => d.getUTCFullYear())]),
  ].sort((a, b) => b - a);

  return {
    thisYear: summarize(yearStart),
    lastYear: summarize(lastYearStart),
    streak: streakFrom(sessionDays),
    record: longestStreak(sessionDays),
    busiest:
      busiestIdx.i >= 0
        ? { day: WEEKDAYS_LONG[busiestIdx.i], avg: Math.round(busiestIdx.avg) }
        : null,
    fastest: sortedByDays[0] ?? null,
    slowest:
      sortedByDays.length > 1 &&
      sortedByDays[sortedByDays.length - 1].days > sortedByDays[0].days
        ? sortedByDays[sortedByDays.length - 1]
        : null,
    minutesByDay,
    years,
    today: toISODay(now),
    entries: entries.map((e) => ({
      id: e.id,
      date: fmtDayWeek(e.date),
      book: toCover(e.book),
      pages: e.pages,
      minutes: e.minutes,
      note: e.note,
    })),
    entriesTotal,
  };
}

export async function getAvaliacoes(userId: string, isOwner: boolean) {
  const rows = await db.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      book: { select: bookSummarySelect },
      _count: { select: { likes: true, comments: true } },
    },
  });
  const readings = await db.reading.findMany({
    where: {
      userId,
      status: "FINISHED",
      bookId: { in: rows.map((r) => r.bookId) },
    },
    orderBy: { endedAt: "desc" },
  });
  return rows.map((r) => {
    const reading = readings.find((x) => x.bookId === r.bookId);
    return {
      id: r.id,
      book: toCover(r.book),
      stars: r.rating,
      text: r.hiddenAt && !isOwner ? "" : (r.text ?? ""),
      spoiler: r.spoiler,
      hidden: r.hiddenAt != null,
      date: fmtDay(dayOf(r.createdAt)),
      days: reading ? spanDays(reading) : null,
      likes: r._count.likes,
      comments: r._count.comments,
    };
  });
}

export async function getListas(userId: string, viewerId: string | null) {
  const own = await db.list.findMany({
    where: listsWhereForProfile(userId, viewerId),
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { name: true } },
      members: { select: { userId: true, pinned: true } },
      items: {
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { book: { select: bookSummarySelect } },
      },
      _count: { select: { items: true, members: true } },
    },
  });
  const followed =
    viewerId === userId
      ? await db.list.findMany({
          where: {
            followers: { some: { userId } },
            visibility: "PUBLIC",
          },
          orderBy: { updatedAt: "desc" },
          include: {
            owner: { select: { name: true } },
            members: { select: { userId: true, pinned: true } },
            items: {
              orderBy: { createdAt: "desc" },
              take: 4,
              include: { book: { select: bookSummarySelect } },
            },
            _count: { select: { items: true, members: true } },
          },
        })
      : [];

  const shape = (l: (typeof own)[number], following: boolean) => ({
    id: l.id,
    title: l.title,
    note: l.note,
    count: l._count.items,
    visibility: l.visibility,
    mine: l.ownerId === userId,
    following,
    byInitials: initialsOf(l.owner.name),
    by: byLine(l.owner, l._count.members, l.ownerId === userId),
    updated: fmtAgo(l.updatedAt),
    pinned: l.members.find((m) => m.userId === userId)?.pinned ?? false,
    books: l.items.map((i) => toCover(i.book)),
  });

  return [
    ...own.map((l) => shape(l, false)),
    ...followed.map((l) => shape(l, true)),
  ];
}

export async function getCurtidas(userId: string) {
  const rows = await db.userBook.findMany({
    where: { userId, liked: true },
    orderBy: { likedAt: "desc" },
    include: { book: { select: bookSummarySelect } },
  });
  return rows.map((r) => ({
    book: toCover(r.book),
    when: r.likedAt ? fmtAgo(r.likedAt) : "",
    year: (r.likedAt ? dayOf(r.likedAt) : today()).getUTCFullYear(),
  }));
}

export async function getAbandonos(userId: string) {
  const rows = await db.userBook.findMany({
    where: { userId, status: "ABANDONED" },
    orderBy: { statusChangedAt: "desc" },
    include: { book: { select: bookSummarySelect } },
  });
  const readings = await db.reading.findMany({
    where: {
      userId,
      status: "ABANDONED",
      bookId: { in: rows.map((r) => r.bookId) },
    },
    orderBy: { endedAt: "desc" },
  });
  return rows.map((r) => {
    const reading = readings.find((x) => x.bookId === r.bookId);
    const page = reading?.endPage ?? r.currentPage;
    const total = r.book.pageCount ?? 0;
    const ended = reading?.endedAt ?? today();
    return {
      book: toCover(r.book),
      percent: total ? Math.min(100, Math.round((page / total) * 100)) : 0,
      page,
      total,
      abandonedAt: fmtDay(ended),
      abandonedTs: ended.getTime(),
      spentDays: reading?.startedAt ? readingDays(reading.startedAt, ended) : 1,
      reason: r.abandonReason,
      again: r.wantsToReturn,
    };
  });
}

export async function getReleituras(userId: string) {
  const ids = await rereadBookIds(userId);
  if (!ids.length) return [];
  const [readings, entries] = await Promise.all([
    db.reading.findMany({
      where: {
        userId,
        bookId: { in: ids },
        status: { in: ["FINISHED", "ACTIVE"] },
      },
      orderBy: { number: "asc" },
    }),
    db.userBook.findMany({
      where: { userId, bookId: { in: ids } },
      include: { book: { select: bookSummarySelect } },
    }),
  ]);
  return entries
    .map((e) => {
      const rs = readings.filter((r) => r.bookId === e.bookId);
      const last = rs[rs.length - 1];
      const dateOf = (r: (typeof rs)[number]) =>
        r.endedAt ?? r.startedAt ?? dayOf(r.createdAt);
      const lastDate = dateOf(last);
      return {
        book: toCover(e.book),
        times: rs.length,
        dates: rs.map(
          (r, i) =>
            `${dateOf(r).getUTCFullYear()} · ${i + 1}ª${r.status === "ACTIVE" ? " (lendo)" : ""}`,
        ),
        last: fmtMonthYear(lastDate),
        lastTs: lastDate.getTime(),
        note: e.note,
      };
    })
    .sort((a, b) => b.lastTs - a.lastTs);
}
