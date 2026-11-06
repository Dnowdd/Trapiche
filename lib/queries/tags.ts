import { db } from "../db";
import { editionIds } from "../works";

export const tagSelect = {
  id: true,
  name: true,
  color: true,
  private: true,
} as const;

export type TagItem = {
  id: string;
  name: string;
  color: string;
  private: boolean;
};

export async function getUserTags(userId: string, includePrivate: boolean) {
  const tags = await db.tag.findMany({
    where: { userId, ...(includePrivate ? {} : { private: false }) },
    orderBy: { name: "asc" },
    select: {
      ...tagSelect,
      _count: {
        select: { books: { where: { userBook: { status: { not: null } } } } },
      },
    },
  });
  return tags.map(({ _count, ...t }) => ({ ...t, count: _count.books }));
}

export async function getBookTags(bookId: string, viewerId: string | null) {
  if (!viewerId) return null;
  const ids = await editionIds(bookId);
  const [tags, entry] = await Promise.all([
    db.tag.findMany({
      where: { userId: viewerId },
      orderBy: { name: "asc" },
      select: tagSelect,
    }),
    db.userBook.findFirst({
      where: { userId: viewerId, bookId: { in: ids } },
      orderBy: { updatedAt: "desc" },
      select: { bookId: true, status: true, tags: { select: { tagId: true } } },
    }),
  ]);
  return {
    tags,
    selected: entry?.tags.map((t) => t.tagId) ?? [],
    onShelf: entry?.status != null,
    shelfBookId: entry?.bookId ?? bookId,
  };
}

export type BookTags = NonNullable<Awaited<ReturnType<typeof getBookTags>>>;
