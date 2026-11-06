import { db } from "../db";
import { bookSummarySelect, toCover } from "../books";
import { fmtAgo } from "../dates";
import { editionIds } from "../works";
import { initialsOf } from "./book";

const quoteInclude = {
  user: { select: { name: true, handle: true, image: true } },
} as const;

type QuoteRow = {
  id: string;
  text: string;
  page: number | null;
  note: string | null;
  private: boolean;
  hiddenAt: Date | null;
  createdAt: Date;
  userId: string;
  user: { name: string; handle: string; image: string | null };
};

function shape(q: QuoteRow, viewerId: string | null) {
  return {
    id: q.id,
    text: q.text,
    page: q.page,
    note: q.note,
    private: q.private,
    hidden: q.hiddenAt != null,
    when: fmtAgo(q.createdAt),
    mine: q.userId === viewerId,
    user: { ...q.user, initials: initialsOf(q.user.name) },
  };
}

export type QuoteItem = ReturnType<typeof shape>;

export async function getBookQuotes(
  bookId: string,
  viewerId: string | null,
  take = 6,
) {
  const ids = await editionIds(bookId);
  const [mine, community, total] = await Promise.all([
    viewerId
      ? db.quote.findMany({
          where: { bookId: { in: ids }, userId: viewerId },
          orderBy: [{ page: "asc" }, { createdAt: "asc" }],
          include: quoteInclude,
        })
      : Promise.resolve([]),
    db.quote.findMany({
      where: {
        bookId: { in: ids },
        private: false,
        hiddenAt: null,
        ...(viewerId ? { userId: { not: viewerId } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      include: quoteInclude,
    }),
    db.quote.count({
      where: {
        bookId: { in: ids },
        private: false,
        hiddenAt: null,
        ...(viewerId ? { userId: { not: viewerId } } : {}),
      },
    }),
  ]);
  return {
    mine: mine.map((q) => shape(q, viewerId)),
    community: community.map((q) => shape(q, viewerId)),
    communityTotal: total,
  };
}

export type BookQuotes = Awaited<ReturnType<typeof getBookQuotes>>;

export async function getProfileQuotes(userId: string, isOwner: boolean) {
  const rows = await db.quote.findMany({
    where: {
      userId,
      ...(isOwner ? {} : { private: false, hiddenAt: null }),
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { ...quoteInclude, book: { select: bookSummarySelect } },
  });
  return rows.map((q) => ({
    ...shape(q, isOwner ? userId : null),
    book: toCover(q.book),
  }));
}

export async function countProfileQuotes(userId: string, isOwner: boolean) {
  return db.quote.count({
    where: { userId, ...(isOwner ? {} : { private: false, hiddenAt: null }) },
  });
}

export async function getQuotesPage(
  bookId: string,
  page: number,
  viewerId: string | null,
) {
  const ids = await editionIds(bookId);
  const per = 30;
  const where = { bookId: { in: ids }, private: false, hiddenAt: null };
  const [rows, total] = await Promise.all([
    db.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * per,
      take: per,
      include: quoteInclude,
    }),
    db.quote.count({ where }),
  ]);
  return {
    items: rows.map((q) => shape(q, viewerId)),
    total,
    pages: Math.max(1, Math.ceil(total / per)),
  };
}

export async function getPublicQuote(id: string) {
  const q = await db.quote.findFirst({
    where: { id, private: false, hiddenAt: null },
    include: {
      ...quoteInclude,
      book: {
        select: {
          ...bookSummarySelect,
          publishedDate: true,
          description: true,
        },
      },
    },
  });
  if (!q) return null;
  return {
    ...shape(q, null),
    createdAt: q.createdAt,
    book: { ...toCover(q.book), authors: q.book.authors },
  };
}
