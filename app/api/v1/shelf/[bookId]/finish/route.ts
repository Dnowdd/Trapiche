import { act, apiRoute } from "@/lib/api/http";
import { bool, num, shelfItem, str } from "@/lib/api/write";
import { finishBook } from "@/lib/actions/shelf";

export const POST = apiRoute<{ bookId: string }>(
  async ({ userId, body }, { bookId }) => {
    const b = await body();
    const rating = num(b, "rating");
    const result = await act(userId, () =>
      finishBook(bookId, {
        startedAt: str(b, "startedAt"),
        finishedAt: str(b, "finishedAt"),
        review:
          rating !== undefined
            ? {
                rating,
                text: str(b, "review"),
                spoiler: bool(b, "spoiler"),
              }
            : undefined,
      }),
    );
    const item = await shelfItem(userId, bookId);
    return { data: { ...item.data, days: result?.days ?? null } };
  },
  { write: true },
);
