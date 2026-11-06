import { act, apiRoute } from "@/lib/api/http";
import { bool, str } from "@/lib/api/write";
import { createTag } from "@/lib/actions/tags";
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

export const POST = apiRoute(
  async ({ userId, body }) => {
    const b = await body();
    const tag = await act(userId, () =>
      createTag({
        name: str(b, "name", true)!,
        color: str(b, "color"),
        private: bool(b, "private"),
      }),
    );
    return { data: tag };
  },
  { write: true, status: 201 },
);
