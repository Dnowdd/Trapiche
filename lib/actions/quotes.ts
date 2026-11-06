"use server";

import { revalidate } from "../revalidate";
import { db } from "../db";
import { ensureBook } from "../books";
import { fail, throttle, withUser } from "./result";
import { parseQuote, type QuoteInput } from "../quotes";

const MAX_PER_BOOK = 300;

export async function addQuote(bookId: string, input: QuoteInput) {
  return withUser(async (userId) => {
    await throttle(userId, "quote", 40, 3_600_000);
    const data = parseQuote(input);
    await ensureBook(bookId);
    const count = await db.quote.count({ where: { userId, bookId } });
    if (count >= MAX_PER_BOOK)
      fail("Você chegou ao limite de citações deste livro.");
    const quote = await db.quote.create({
      data: { ...data, userId, bookId },
      select: { id: true },
    });
    revalidate();
    return quote;
  });
}

export async function updateQuote(quoteId: string, input: QuoteInput) {
  return withUser(async (userId) => {
    const data = parseQuote(input);
    const { count } = await db.quote.updateMany({
      where: { id: quoteId, userId },
      data,
    });
    if (!count) fail("Essa citação não existe mais.");
    revalidate();
  });
}

export async function deleteQuote(quoteId: string) {
  return withUser(async (userId) => {
    await db.quote.deleteMany({ where: { id: quoteId, userId } });
    revalidate();
  });
}
