import { db } from "@/lib/db";
import { apiRoute, enumParam, pageParams, paginated } from "@/lib/api/http";
import { apiList, apiListSelect } from "@/lib/api/lists";
import type { Prisma } from "@/lib/generated/prisma/client";

const VISIBILITY = ["PUBLIC", "PRIVATE", "SHARED"] as const;

export const GET = apiRoute(async ({ userId, params }) => {
  const page = pageParams(params);
  const visibility = enumParam(params, "visibility", VISIBILITY);
  const where: Prisma.ListWhereInput = {
    members: { some: { userId } },
    ...(visibility ? { visibility: { in: visibility } } : {}),
  };
  const [rows, total] = await Promise.all([
    db.list.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      skip: page.skip,
      take: page.take,
      select: apiListSelect,
    }),
    db.list.count({ where }),
  ]);
  return paginated(rows.map(apiList), total, page);
});
