import { db } from "@/lib/db";
import {
  apiRoute,
  badParam,
  boolParam,
  enumParam,
  pageParams,
  paginated,
} from "@/lib/api/http";
import { apiBook, apiBookSelect, iso } from "@/lib/api/serialize";
import type { Prisma } from "@/lib/generated/prisma/client";

const STATUSES = ["WANT", "READING", "READ", "ABANDONED", "REREADING"] as const;
const SORTS = {
  updated: { statusChangedAt: "desc" },
  added: { createdAt: "desc" },
  title: { book: { title: "asc" } },
} as const;

export const GET = apiRoute(async ({ userId, params }) => {
  const page = pageParams(params);
  const status = enumParam(params, "status", STATUSES);
  const liked = boolParam(params, "liked");
  const favorite = boolParam(params, "favorite");
  const q = params.get("q")?.trim();
  if (q && q.length > 100) throw badParam("q", "no máximo 100 caracteres.");
  const sort = params.get("sort") ?? "updated";
  if (!(sort in SORTS))
    throw badParam(
      "sort",
      `valores aceitos: ${Object.keys(SORTS).join(", ")}.`,
    );

  const where: Prisma.UserBookWhereInput = {
    userId,
    status: status ? { in: status } : { not: null },
    ...(liked != null ? { liked } : {}),
    ...(favorite != null
      ? { favoritePosition: favorite ? { not: null } : null }
      : {}),
    ...(q
      ? {
          book: {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { authors: { has: q } },
            ],
          },
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.userBook.findMany({
      where,
      orderBy: [SORTS[sort as keyof typeof SORTS], { id: "asc" }],
      skip: page.skip,
      take: page.take,
      select: {
        status: true,
        statusChangedAt: true,
        createdAt: true,
        liked: true,
        favoritePosition: true,
        currentPage: true,
        book: { select: apiBookSelect },
      },
    }),
    db.userBook.count({ where }),
  ]);

  return paginated(
    rows.map((r) => ({
      status: r.status,
      statusChangedAt: iso(r.statusChangedAt),
      addedAt: iso(r.createdAt),
      liked: r.liked,
      favoritePosition: r.favoritePosition,
      currentPage: r.currentPage,
      book: apiBook(r.book),
    })),
    total,
    page,
  );
});
