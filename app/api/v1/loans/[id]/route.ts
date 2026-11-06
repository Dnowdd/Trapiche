import { act, apiRoute } from "@/lib/api/http";
import { str } from "@/lib/api/write";
import { deleteLoan, updateLoan } from "@/lib/actions/loans";
import { apiLoan, ownLoan } from "@/lib/api/loans";

type P = { id: string };

export const GET = apiRoute<P>(async ({ userId }, { id }) => ({
  data: apiLoan(await ownLoan(userId, id)),
}));

export const PATCH = apiRoute<P>(
  async ({ userId, body }, { id }) => {
    const current = apiLoan(await ownLoan(userId, id));
    const b = await body();
    await act(userId, () =>
      updateLoan(id, {
        person: str(b, "person") ?? current.person,
        lentAt: str(b, "lentAt") ?? current.lentAt,
        dueAt: b.dueAt === null ? null : (str(b, "dueAt") ?? current.dueAt),
        note: b.note === null ? null : (str(b, "note") ?? current.note),
      }),
    );
    return { data: apiLoan(await ownLoan(userId, id)) };
  },
  { write: true },
);

export const DELETE = apiRoute<P>(
  async ({ userId }, { id }) => {
    await ownLoan(userId, id);
    await act(userId, () => deleteLoan(id));
    return { ok: true };
  },
  { write: true },
);
