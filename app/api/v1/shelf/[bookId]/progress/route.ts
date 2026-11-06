import { act, apiRoute } from "@/lib/api/http";
import { num, shelfItem, str } from "@/lib/api/write";
import { updateProgress } from "@/lib/actions/shelf";

export const PUT = apiRoute<{ bookId: string }>(
  async ({ userId, body }, { bookId }) => {
    const b = await body();
    await act(userId, () =>
      updateProgress(bookId, {
        currentPage: num(b, "currentPage"),
        percent: num(b, "percent"),
        audioPosition: num(b, "audioPosition"),
        audioLength: b.audioLength === null ? null : num(b, "audioLength"),
        startedAt: str(b, "startedAt") ?? null,
        pageCount: num(b, "pageCount") ?? null,
      }),
    );
    return shelfItem(userId, bookId);
  },
  { write: true },
);
