import { apiRoute } from "@/lib/api/http";
import { iso } from "@/lib/api/serialize";
import { db } from "@/lib/db";

export const GET = apiRoute(async ({ userId }) => {
  const tags = await db.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      private: true,
      createdAt: true,
      _count: {
        select: { books: { where: { userBook: { status: { not: null } } } } },
      },
    },
  });
  return {
    data: tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      private: t.private,
      books: t._count.books,
      createdAt: iso(t.createdAt),
    })),
  };
});
