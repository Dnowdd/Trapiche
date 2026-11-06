import { db } from "../db";
import { ApiError } from "./http";
import { apiBook, apiBookSelect, iso } from "./serialize";

export const quoteSelect = {
  id: true,
  text: true,
  page: true,
  note: true,
  private: true,
  hiddenAt: true,
  createdAt: true,
  updatedAt: true,
  book: { select: apiBookSelect },
} as const;

type Row = {
  id: string;
  text: string;
  page: number | null;
  note: string | null;
  private: boolean;
  hiddenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  book: Parameters<typeof apiBook>[0];
};

export function apiQuote(q: Row) {
  return {
    id: q.id,
    text: q.text,
    page: q.page,
    note: q.note,
    private: q.private,
    hidden: q.hiddenAt != null,
    createdAt: iso(q.createdAt),
    updatedAt: iso(q.updatedAt),
    book: apiBook(q.book),
  };
}

export async function ownQuote(userId: string, id: string) {
  const q = await db.quote.findFirst({
    where: { id, userId },
    select: quoteSelect,
  });
  if (!q) throw new ApiError(404, "not_found", "Citação não encontrada.");
  return { data: apiQuote(q) };
}
