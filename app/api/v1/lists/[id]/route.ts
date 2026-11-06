import { db } from "@/lib/db";
import { act, ApiError, apiRoute } from "@/lib/api/http";
import { oneOf, str } from "@/lib/api/write";
import { deleteList, updateList } from "@/lib/actions/lists";
import { apiList, apiListSelect, visibleTo } from "@/lib/api/lists";

export const GET = apiRoute<{ id: string }>(async ({ userId }, { id }) => {
  const list = await db.list.findFirst({
    where: { id, ...visibleTo(userId) },
    select: apiListSelect,
  });
  if (!list) throw new ApiError(404, "not_found", "Lista não encontrada.");
  return { data: apiList(list) };
});

export const PATCH = apiRoute<{ id: string }>(
  async ({ userId, body }, { id }) => {
    const current = await db.list.findFirst({
      where: { id, ownerId: userId },
      select: { title: true, note: true, visibility: true },
    });
    if (!current) throw new ApiError(404, "not_found", "Lista não encontrada.");
    const b = await body();
    await act(userId, () =>
      updateList(id, {
        title: str(b, "title") ?? current.title,
        note: b.note === null ? "" : (str(b, "note") ?? current.note ?? ""),
        visibility:
          oneOf(b, "visibility", ["PUBLIC", "PRIVATE", "SHARED"]) ??
          current.visibility,
      }),
    );
    const list = await db.list.findUniqueOrThrow({
      where: { id },
      select: apiListSelect,
    });
    return { data: apiList(list) };
  },
  { write: true },
);

export const DELETE = apiRoute<{ id: string }>(
  async ({ userId }, { id }) => {
    await act(userId, () => deleteList(id));
    return { ok: true };
  },
  { write: true },
);
