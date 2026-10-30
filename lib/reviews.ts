import { fail } from "./actions/result";
import type { Prisma } from "./generated/prisma/client";

export interface ReviewInput {
  rating: number;
  text?: string;
  spoiler?: boolean;
}

export function parseReview(input: ReviewInput) {
  const rating = Number(input.rating);
  if (!Number.isInteger(rating * 2) || rating < 0.5 || rating > 5)
    fail("Escolha uma nota de meia a 5 estrelas.");
  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (text.length > 5000)
    fail("A resenha pode ter no máximo 5.000 caracteres.");
  return { rating, text, spoiler: Boolean(text && input.spoiler) };
}

export async function upsertReview(
  tx: Prisma.TransactionClient,
  userId: string,
  bookId: string,
  editionIds: string[],
  { rating, text, spoiler }: ReturnType<typeof parseReview>,
) {
  const existing =
    (await tx.review.findUnique({
      where: { userId_bookId: { userId, bookId } },
    })) ??
    (await tx.review.findFirst({
      where: { userId, bookId: { in: editionIds } },
      orderBy: { updatedAt: "desc" },
    }));
  const review = existing
    ? await tx.review.update({
        where: { id: existing.id },
        data: { rating, text: text || null, spoiler },
      })
    : await tx.review.create({
        data: { userId, bookId, rating, text: text || null, spoiler },
      });
  const snippet = text ? text.slice(0, 280) : null;
  if (existing) {
    await tx.activity.updateMany({
      where: { reviewId: review.id },
      data: { rating, text: snippet },
    });
  } else {
    await tx.activity.create({
      data: {
        userId,
        bookId,
        reviewId: review.id,
        kind: "REVIEW",
        rating,
        text: snippet,
      },
    });
  }
}
