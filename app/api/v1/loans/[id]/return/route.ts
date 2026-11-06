import { act, apiRoute } from "@/lib/api/http";
import { str } from "@/lib/api/write";
import { returnLoan } from "@/lib/actions/loans";
import { apiLoan, ownLoan } from "@/lib/api/loans";

export const POST = apiRoute<{ id: string }>(
  async ({ userId, body }, { id }) => {
    await ownLoan(userId, id);
    const b = await body();
    await act(userId, () => returnLoan(id, str(b, "returnedAt") ?? null));
    return { data: apiLoan(await ownLoan(userId, id)) };
  },
  { write: true },
);
