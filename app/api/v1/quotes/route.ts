import { db } from "@/lib/db";
import {
  apiRoute,
  badParam,
  boolParam,
  pageParams,
  paginated,
} from "@/lib/api/http";
import { apiBook, apiBookSelect, iso } from "@/lib/api/serialize";
import type { Prisma } from "@/lib/generated/prisma/client";

export const GET = apiRoute(async ({ userId, params }) => {
  const page = pageParams(params);
  const book = params.get("book")?.trim();
  if (book && book.length > 64) throw badParam("book", "id de livro inválido.");
  const isPrivate = boolParam(params, "private");
  const where: Prisma.QuoteWhereInput = {
    userId,
    ...(book ? { bookId: book } : {}),
    ...(isPrivate != null ? { private: isPrivate } : {}),
  };
  const [rows, total] = await Promise.all([
    db.quote.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: page.skip,
      take: page.take,
      select: {
        id: true,
        text: true,
        page: true,
        note: true,
        private: true,
        hiddenAt: true,
        createdAt: true,
        updatedAt: true,
        book: { select: apiBookSelect },
      },
    }),
    db.quote.count({ where }),
  ]);
  return paginated(
    rows.map((q) => ({
      id: q.id,
      text: q.text,
      page: q.page,
      note: q.note,
      private: q.private,
      hidden: q.hiddenAt != null,
      createdAt: iso(q.createdAt),
      updatedAt: iso(q.updatedAt),
      book: apiBook(q.book),
    })),
    total,
    page,
  );
});
