import { act, apiRoute } from "@/lib/api/http";
import { num, shelfItem, str } from "@/lib/api/write";
import { logReadingSession } from "@/lib/actions/shelf";

export const POST = apiRoute<{ bookId: string }>(
  async ({ userId, body }, { bookId }) => {
    const b = await body();
    await act(userId, () =>
      logReadingSession(bookId, {
        date: str(b, "date", true)!,
        pageEnd: num(b, "pageEnd"),
        percentEnd: num(b, "percentEnd"),
        audioPosition: num(b, "audioPosition"),
        minutes: num(b, "minutes", true)!,
        note: str(b, "note"),
        pageCount: num(b, "pageCount") ?? null,
      }),
    );
    return shelfItem(userId, bookId);
  },
  { write: true, status: 201 },
);
