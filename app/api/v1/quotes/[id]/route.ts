import { act, apiRoute } from "@/lib/api/http";
import { bool, num, str } from "@/lib/api/write";
import { deleteQuote, updateQuote } from "@/lib/actions/quotes";
import { ownQuote } from "@/lib/api/quotes";

type P = { id: string };

export const GET = apiRoute<P>(({ userId }, { id }) => ownQuote(userId, id));

export const PATCH = apiRoute<P>(
  async ({ userId, body }, { id }) => {
    const current = (await ownQuote(userId, id)).data;
    const b = await body();
    const page = b.page === null ? null : (num(b, "page") ?? current.page);
    const note = b.note === null ? null : (str(b, "note") ?? current.note);
    await act(userId, () =>
      updateQuote(id, {
        text: str(b, "text") ?? current.text,
        page,
        note,
        private: bool(b, "private") ?? current.private,
      }),
    );
    return ownQuote(userId, id);
  },
  { write: true },
);

export const DELETE = apiRoute<P>(
  async ({ userId }, { id }) => {
    await ownQuote(userId, id);
    await act(userId, () => deleteQuote(id));
    return { ok: true };
  },
  { write: true },
);
