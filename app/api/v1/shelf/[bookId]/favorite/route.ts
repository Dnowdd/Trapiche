import { act, apiRoute } from "@/lib/api/http";
import { bool, shelfItem } from "@/lib/api/write";
import { toggleFavorite } from "@/lib/actions/shelf";
import { db } from "@/lib/db";

export const PUT = apiRoute<{ bookId: string }>(
  async ({ userId, body }, { bookId }) => {
    const favorite = bool(await body(), "favorite", true)!;
    const entry = await db.userBook.findUnique({
      where: { userId_bookId: { userId, bookId } },
      select: { favoritePosition: true },
    });
    if ((entry?.favoritePosition != null) !== favorite)
      await act(userId, () => toggleFavorite(bookId));
    return shelfItem(userId, bookId);
  },
  { write: true },
);
