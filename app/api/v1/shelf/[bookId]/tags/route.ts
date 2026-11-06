import { act, apiRoute } from "@/lib/api/http";
import { shelfItem, strArray } from "@/lib/api/write";
import { setBookTags } from "@/lib/actions/tags";

export const PUT = apiRoute<{ bookId: string }>(
  async ({ userId, body }, { bookId }) => {
    const tagIds = strArray(await body(), "tagIds");
    await act(userId, () => setBookTags(bookId, tagIds));
    return shelfItem(userId, bookId);
  },
  { write: true },
);
