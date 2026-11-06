import { act, apiRoute } from "@/lib/api/http";
import { bool, num, shelfItem, str } from "@/lib/api/write";
import { abandonBook } from "@/lib/actions/shelf";

export const POST = apiRoute<{ bookId: string }>(
  async ({ userId, body }, { bookId }) => {
    const b = await body();
    await act(userId, () =>
      abandonBook(bookId, {
        page: num(b, "page", true)!,
        reason: str(b, "reason"),
        wantsToReturn: bool(b, "wantsToReturn") ?? true,
      }),
    );
    return shelfItem(userId, bookId);
  },
  { write: true },
);
