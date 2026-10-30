import { db } from "@/lib/db";
import { ApiError, apiRoute } from "@/lib/api/http";
import { apiList, apiListSelect, visibleTo } from "@/lib/api/lists";

export const GET = apiRoute<{ id: string }>(async ({ userId }, { id }) => {
  const list = await db.list.findFirst({
    where: { id, ...visibleTo(userId) },
    select: apiListSelect,
  });
  if (!list) throw new ApiError(404, "not_found", "Lista não encontrada.");
  return { data: apiList(list) };
});
