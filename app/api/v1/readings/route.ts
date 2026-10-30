import { db } from "@/lib/db";
import {
  apiRoute,
  badParam,
  enumParam,
  pageParams,
  paginated,
} from "@/lib/api/http";
import { apiBook, apiBookSelect, partialDate } from "@/lib/api/serialize";
import type { Prisma } from "@/lib/generated/prisma/client";

const STATUSES = ["ACTIVE", "FINISHED", "ABANDONED"] as const;

export const GET = apiRoute(async ({ userId, params }) => {
  const page = pageParams(params);
  const status = enumParam(params, "status", STATUSES);
  const rawYear = params.get("year");
  let year: number | undefined;
  if (rawYear) {
    if (!/^\d{4}$/.test(rawYear)) throw badParam("year", "use 4 dígitos.");
    year = Number(rawYear);
  }
  const where: Prisma.ReadingWhereInput = {
    userId,
    ...(status ? { status: { in: status } } : {}),
    ...(year
      ? {
          endedAt: {
            gte: new Date(Date.UTC(year, 0, 1)),
            lt: new Date(Date.UTC(year + 1, 0, 1)),
          },
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.reading.findMany({
      where,
      orderBy: [
        { endedAt: { sort: "desc", nulls: "first" } },
        { startedAt: { sort: "desc", nulls: "last" } },
        { id: "asc" },
      ],
      skip: page.skip,
      take: page.take,
      select: {
        id: true,
        number: true,
        status: true,
        startedAt: true,
        startPrecision: true,
        endedAt: true,
        endPrecision: true,
        endPage: true,
        book: { select: apiBookSelect },
      },
    }),
    db.reading.count({ where }),
  ]);
  return paginated(
    rows.map((r) => ({
      id: r.id,
      number: r.number,
      status: r.status,
      startedAt: partialDate(r.startedAt, r.startPrecision),
      endedAt: partialDate(r.endedAt, r.endPrecision),
      endPage: r.endPage,
      book: apiBook(r.book),
    })),
    total,
    page,
  );
});
