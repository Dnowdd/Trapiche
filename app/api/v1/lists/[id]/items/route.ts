import { db } from "@/lib/db";
import { ApiError, apiRoute, pageParams, paginated } from "@/lib/api/http";
import { visibleTo } from "@/lib/api/lists";
import { apiBook, apiBookSelect, iso } from "@/lib/api/serialize";

export const GET = apiRoute<{ id: string }>(
  async ({ userId, params }, { id }) => {
    const page = pageParams(params);
    const list = await db.list.findFirst({
      where: { id, ...visibleTo(userId) },
      select: { id: true },
    });
    if (!list) throw new ApiError(404, "not_found", "Lista não encontrada.");
    const [rows, total] = await Promise.all([
      db.listItem.findMany({
        where: { listId: id },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: page.skip,
        take: page.take,
        select: {
          createdAt: true,
          addedBy: { select: { handle: true } },
          book: { select: apiBookSelect },
        },
      }),
      db.listItem.count({ where: { listId: id } }),
    ]);
    return paginated(
      rows.map((r) => ({
        addedAt: iso(r.createdAt),
        addedBy: r.addedBy.handle,
        book: apiBook(r.book),
      })),
      total,
      page,
    );
  },
);
