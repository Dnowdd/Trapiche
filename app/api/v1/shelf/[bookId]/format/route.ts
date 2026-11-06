import { act, apiRoute } from "@/lib/api/http";
import { num, oneOf, shelfItem } from "@/lib/api/write";
import { setReadingFormat } from "@/lib/actions/shelf";

export const PUT = apiRoute<{ bookId: string }>(
  async ({ userId, body }, { bookId }) => {
    const b = await body();
    const format = oneOf(b, "format", ["PRINT", "EBOOK", "AUDIO"], true)!;
    await act(userId, () =>
      setReadingFormat(bookId, format, {
        audioLength: b.audioLength === null ? null : num(b, "audioLength"),
      }),
    );
    return shelfItem(userId, bookId);
  },
  { write: true },
);
