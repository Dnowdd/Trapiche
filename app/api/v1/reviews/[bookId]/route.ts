import { act, apiRoute } from "@/lib/api/http";
import { bool, num, str } from "@/lib/api/write";
import { deleteReview, saveReview } from "@/lib/actions/reviews";
import { db } from "@/lib/db";
import { editionIds } from "@/lib/works";
import { iso } from "@/lib/api/serialize";

type P = { bookId: string };

async function myReview(userId: string, bookId: string) {
  const review = await db.review.findFirst({
    where: { userId, bookId: { in: await editionIds(bookId) } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      bookId: true,
      rating: true,
      text: true,
      spoiler: true,
      hiddenAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return {
    data: review
      ? {
          id: review.id,
          bookId: review.bookId,
          rating: review.rating,
          text: review.text,
          spoiler: review.spoiler,
          hidden: review.hiddenAt != null,
          createdAt: iso(review.createdAt),
          updatedAt: iso(review.updatedAt),
        }
      : null,
  };
}

export const GET = apiRoute<P>(({ userId }, { bookId }) =>
  myReview(userId, bookId),
);

export const PUT = apiRoute<P>(
  async ({ userId, body }, { bookId }) => {
    const b = await body();
    await act(userId, () =>
      saveReview(bookId, {
        rating: num(b, "rating", true)!,
        text: str(b, "text"),
        spoiler: bool(b, "spoiler"),
      }),
    );
    return myReview(userId, bookId);
  },
  { write: true },
);

export const DELETE = apiRoute<P>(
  async ({ userId }, { bookId }) => {
    await act(userId, () => deleteReview(bookId));
    return { ok: true };
  },
  { write: true },
);
