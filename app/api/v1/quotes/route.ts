import { db } from "@/lib/db";
import {
  act,
  apiRoute,
  badParam,
  boolParam,
  pageParams,
  paginated,
} from "@/lib/api/http";
import { bool, num, str } from "@/lib/api/write";
import { addQuote } from "@/lib/actions/quotes";
import { apiQuote, ownQuote, quoteSelect } from "@/lib/api/quotes";
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
      select: quoteSelect,
    }),
    db.quote.count({ where }),
  ]);
  return paginated(rows.map(apiQuote), total, page);
});

export const POST = apiRoute(
  async ({ userId, body }) => {
    const b = await body();
    const bookId = str(b, "bookId", true)!;
    const created = await act(userId, () =>
      addQuote(bookId, {
        text: str(b, "text", true)!,
        page: num(b, "page") ?? null,
        note: str(b, "note") ?? null,
        private: bool(b, "private") ?? false,
      }),
    );
    return ownQuote(userId, created!.id);
  },
  { write: true, status: 201 },
);
