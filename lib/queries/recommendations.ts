import { db } from "../db";
import { bookSummarySelect, cleanAuthors, toCover } from "../books";
import { cleanAuthor, sameTitle } from "../editions";
import { getHomePopular } from "./home";
import type { Book as CoverBook } from "../types/book";

const ENGAGED = ["READ", "READING", "REREADING"] as const;
const MAX_PEERS = 300;

type Candidate = {
  score: number;
  best: number;
  reason: string;
  books: Map<string, number>;
};

export interface Recommendation {
  book: CoverBook;
  reason: string;
}

const workOf = (b: { id: string; workId: string | null }) => b.workId ?? b.id;

export async function getRecommendations(
  userId: string,
  take = 8,
): Promise<Recommendation[]> {
  const mine = await db.userBook.findMany({
    where: { userId },
    select: {
      status: true,
      liked: true,
      favoritePosition: true,
      book: { select: { id: true, title: true, authors: true, workId: true } },
    },
  });
  const myWorks = new Set(mine.map((m) => workOf(m.book)));
  const ratings = await db.review.findMany({
    where: { userId },
    select: { bookId: true, rating: true },
  });
  const rating = new Map(ratings.map((r) => [r.bookId, r.rating]));
  const seeds = mine
    .filter(
      (m) =>
        (m.status && ENGAGED.includes(m.status as (typeof ENGAGED)[number])) ||
        m.liked ||
        m.favoritePosition != null,
    )
    .filter((m) => (rating.get(m.book.id) ?? 5) >= 3)
    .map((m) => ({
      ...m.book,
      weight:
        1 +
        (m.favoritePosition != null ? 2 : 0) +
        (m.liked ? 1 : 0) +
        Math.max(0, (rating.get(m.book.id) ?? 3) - 3),
    }));

  const candidates = new Map<string, Candidate>();
  const add = (key: string, bookId: string, score: number, reason: string) => {
    if (myWorks.has(key)) return;
    const c: Candidate = candidates.get(key) ?? {
      score: 0,
      best: 0,
      reason,
      books: new Map(),
    };
    if (score > c.best) {
      c.best = score;
      c.reason = reason;
    }
    c.score += score;
    c.books.set(bookId, (c.books.get(bookId) ?? 0) + 1);
    candidates.set(key, c);
  };

  if (seeds.length) {
    const seedWorks = new Map(seeds.map((s) => [workOf(s), s]));
    const seedBooks = await db.book.findMany({
      where: {
        OR: [
          { id: { in: seeds.map((s) => s.id) } },
          {
            workId: { in: seeds.flatMap((s) => (s.workId ? [s.workId] : [])) },
          },
        ],
      },
      select: { id: true, workId: true },
    });
    const peersRows = await db.userBook.findMany({
      where: {
        bookId: { in: seedBooks.map((b) => b.id) },
        userId: { not: userId },
        OR: [{ status: { in: [...ENGAGED] } }, { liked: true }],
      },
      take: MAX_PEERS * 4,
      select: { userId: true, book: { select: { id: true, workId: true } } },
    });
    const overlap = new Map<string, { count: number; via: string }>();
    for (const p of peersRows) {
      const seed = seedWorks.get(workOf(p.book));
      if (!seed) continue;
      const o = overlap.get(p.userId) ?? { count: 0, via: seed.title };
      o.count += seed.weight;
      overlap.set(p.userId, o);
    }
    const peers = [...overlap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, MAX_PEERS);
    if (peers.length) {
      const theirs = await db.userBook.findMany({
        where: {
          userId: { in: peers.map(([id]) => id) },
          OR: [
            { status: "READ" },
            { liked: true },
            { favoritePosition: { not: null } },
          ],
        },
        select: {
          userId: true,
          book: { select: { id: true, workId: true } },
        },
      });
      const peerOf = new Map(peers);
      for (const t of theirs) {
        const peer = peerOf.get(t.userId)!;
        add(
          workOf(t.book),
          t.book.id,
          1 + Math.log2(1 + peer.count),
          `Quem leu ${peer.via} também leu`,
        );
      }
    }

    const authors = [
      ...new Set(
        seeds.flatMap((s) =>
          cleanAuthors(s.authors).slice(0, 1).map(cleanAuthor),
        ),
      ),
    ].slice(0, 12);
    if (authors.length) {
      const byAuthor = await db.book.findMany({
        where: {
          OR: authors.map((a) => ({ authors: { has: a } })),
          coverUrl: { not: null },
        },
        take: 200,
        select: { id: true, workId: true, authors: true },
      });
      for (const b of byAuthor) {
        const author = authors.find((a) => b.authors.includes(a));
        if (author) add(workOf(b), b.id, 1.5, `Mais de ${author}`);
      }
    }
  }

  const ranked = [...candidates.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, take * 2);
  const ids = ranked.map(
    (c) => [...c.books.entries()].sort((a, b) => b[1] - a[1])[0][0],
  );
  const rows = await db.book.findMany({
    where: { id: { in: ids } },
    select: bookSummarySelect,
  });
  const result: Recommendation[] = [];
  ranked.forEach((c, i) => {
    const row = rows.find((r) => r.id === ids[i]);
    if (row && mine.some((m) => sameTitle(m.book.title, row.title))) return;
    if (row && result.length < take)
      result.push({ book: toCover(row), reason: c.reason });
  });

  if (result.length < take) {
    const shown = new Set(result.map((r) => r.book.id));
    const popular = await getHomePopular(take * 2);
    const ids = popular.map((p) => p.book.id);
    const works = await db.book.findMany({
      where: { id: { in: ids } },
      select: { id: true, workId: true },
    });
    for (const p of popular) {
      if (result.length >= take) break;
      const w = works.find((x) => x.id === p.book.id);
      const key = w ? workOf(w) : p.book.id;
      if (
        shown.has(p.book.id) ||
        myWorks.has(key) ||
        mine.some((m) => sameTitle(m.book.title, p.book.title))
      )
        continue;
      result.push({
        book: { ...p.book, id: p.book.googleId ?? p.book.id },
        reason: "Popular no Trapiche",
      });
    }
  }
  return result;
}
