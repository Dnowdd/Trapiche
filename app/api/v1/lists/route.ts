import { db } from "@/lib/db";
import {
  act,
  apiRoute,
  enumParam,
  pageParams,
  paginated,
} from "@/lib/api/http";
import { oneOf, str } from "@/lib/api/write";
import { createList } from "@/lib/actions/lists";
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

export const POST = apiRoute(
  async ({ userId, body }) => {
    const b = await body();
    const created = await act(userId, () =>
      createList({
        title: str(b, "title", true)!,
        note: str(b, "note"),
        visibility: oneOf(b, "visibility", VISIBILITY) ?? "PUBLIC",
      }),
    );
    const list = await db.list.findUniqueOrThrow({
      where: { id: created!.id },
      select: apiListSelect,
    });
    return { data: apiList(list) };
  },
  { write: true, status: 201 },
);
