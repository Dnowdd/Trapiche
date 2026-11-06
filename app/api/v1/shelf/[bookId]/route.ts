import { act, apiRoute } from "@/lib/api/http";
import { oneOf, shelfItem, str } from "@/lib/api/write";
import { setShelfStatus } from "@/lib/actions/shelf";

type P = { bookId: string };

export const GET = apiRoute<P>(({ userId }, { bookId }) =>
  shelfItem(userId, bookId),
);

export const PUT = apiRoute<P>(
  async ({ userId, body }, { bookId }) => {
    const b = await body();
    const status = oneOf(b, "status", ["WANT", "READING", "REREADING"], true)!;
    const startedAt = str(b, "startedAt");
    await act(userId, () => setShelfStatus(bookId, status, { startedAt }));
    return shelfItem(userId, bookId);
  },
  { write: true },
);

export const DELETE = apiRoute<P>(
  async ({ userId }, { bookId }) => {
    await act(userId, () => setShelfStatus(bookId, null));
    return { ok: true };
  },
  { write: true },
);
