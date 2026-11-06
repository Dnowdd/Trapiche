import { act, apiRoute } from "@/lib/api/http";
import { bool, shelfItem } from "@/lib/api/write";
import { toggleBookLike } from "@/lib/actions/shelf";
import { db } from "@/lib/db";

export const PUT = apiRoute<{ bookId: string }>(
  async ({ userId, body }, { bookId }) => {
    const liked = bool(await body(), "liked", true)!;
    const entry = await db.userBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
      select: { liked: true },
    });
    if ((entry?.liked ?? false) !== liked)
      await act(userId, () => toggleBookLike(bookId));
    return shelfItem(userId, bookId);
  },
  { write: true },
);
