import { act, apiRoute } from "@/lib/api/http";
import { removeBookFromList } from "@/lib/actions/lists";

export const DELETE = apiRoute<{ id: string; bookId: string }>(
  async ({ userId }, { id, bookId }) => {
    await act(userId, () => removeBookFromList(id, bookId));
    return { ok: true };
  },
  { write: true },
);
