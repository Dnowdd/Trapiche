import { db } from "../db";
import { bookSummarySelect, toCover } from "../books";
import { dayOf, fmtDay } from "../dates";
import { getFeaturedBooks } from "@/app/catalog";
import { initialsOf } from "./book";

export async function getHomePopular(limit = 8) {
  const groups = await db.userBook.groupBy({
    by: ["bookId"],
    where: { status: { not: null } },
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: limit,
  });
  const rows = await db.book.findMany({
    where: { id: { in: groups.map((g) => g.bookId) } },
    select: bookSummarySelect,
  });
  const popular = groups.flatMap((g) => {
    const row = rows.find((r) => r.id === g.bookId);
    return row ? [{ book: toCover(row), readers: g._count.bookId }] : [];
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
      owner: { select: { name: true } },
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
    count: l._count.items,
    followers: l._count.followers,
    books: l.items.map((i) => toCover(i.book)),
  }));
}

export async function getHomeReviews(limit = 6) {
  const reviews = await db.review.findMany({
    where: { text: { not: null } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      rating: true,
      text: true,
      createdAt: true,
      user: { select: { name: true, handle: true } },
      book: { select: bookSummarySelect },
    },
  });
  return reviews.map((r) => ({
    id: r.id,
    stars: r.rating,
    text: r.text!,
    date: fmtDay(dayOf(r.createdAt)),
    user: r.user.name,
    handle: r.user.handle,
    initials: initialsOf(r.user.name),
    book: toCover(r.book),
  }));
}
