import { db } from "../db";
import { bookSummarySelect, toCover } from "../books";
import { dayOf, fmtDay } from "../dates";
import { getFeaturedBooks } from "@/app/catalog";
import { initialsOf } from "./book";

export async function getHomePopular(limit = 8) {
  const entries = await db.userBook.findMany({
    where: { status: { not: null } },
    orderBy: { statusChangedAt: "desc" },
    take: 5000,
    select: { userId: true, bookId: true, book: { select: { workId: true } } },
  });
  const works = new Map<
    string,
    { readers: Set<string>; books: Map<string, number> }
  >();
  for (const e of entries) {
    const key = e.book.workId ?? e.bookId;
    const w = works.get(key) ?? { readers: new Set(), books: new Map() };
    w.readers.add(e.userId);
    w.books.set(e.bookId, (w.books.get(e.bookId) ?? 0) + 1);
    works.set(key, w);
  }
  const top = [...works.values()]
    .sort((a, b) => b.readers.size - a.readers.size)
    .slice(0, limit);
  const rows = await db.book.findMany({
    where: { id: { in: top.flatMap((w) => [...w.books.keys()]) } },
    select: bookSummarySelect,
  });
  const popular = top.flatMap((w) => {
    const candidates = [...w.books.entries()]
      .map(([id, count]) => ({ row: rows.find((r) => r.id === id), count }))
      .filter((c) => c.row)
      .sort(
        (a, b) =>
          Number(Boolean(b.row!.coverUrl)) - Number(Boolean(a.row!.coverUrl)) ||
          b.count - a.count,
      );
    const best = candidates[0]?.row;
    return best ? [{ book: toCover(best), readers: w.readers.size }] : [];
  });
  if (popular.length >= limit) return popular;

  const seen = new Set(popular.map((p) => p.book.title.toLowerCase()));
  const fill = (await getFeaturedBooks())
    .filter((b) => !seen.has(b.title.toLowerCase()))
    .slice(0, limit - popular.length)
    .map((book) => ({ book, readers: 0 }));
  return [...popular, ...fill];
}

export async function getHomeLists(limit = 3) {
  const lists = await db.list.findMany({
    where: { visibility: "PUBLIC", items: { some: {} } },
    orderBy: [{ followers: { _count: "desc" } }, { updatedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      owner: { select: { name: true, image: true } },
      _count: { select: { items: true, followers: true } },
      items: {
        orderBy: { createdAt: "asc" },
        take: 3,
        select: { book: { select: bookSummarySelect } },
      },
    },
  });
  return lists.map((l) => ({
    id: l.id,
    title: l.title,
    by: l.owner.name,
    byInitials: initialsOf(l.owner.name),
    byName: l.owner.name,
    byImage: l.owner.image,
    count: l._count.items,
    followers: l._count.followers,
    books: l.items.map((i) => toCover(i.book)),
  }));
}

export async function getHomeReviews(limit = 6) {
  const reviews = await db.review.findMany({
    where: { text: { not: null }, hiddenAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      rating: true,
      text: true,
      spoiler: true,
      createdAt: true,
      user: { select: { name: true, handle: true, image: true } },
      book: { select: bookSummarySelect },
    },
  });
  return reviews.map((r) => ({
    id: r.id,
    stars: r.rating,
    text: r.text!,
    spoiler: r.spoiler,
    date: fmtDay(dayOf(r.createdAt)),
    user: r.user.name,
    handle: r.user.handle,
    initials: initialsOf(r.user.name),
    image: r.user.image,
    book: toCover(r.book),
  }));
}
