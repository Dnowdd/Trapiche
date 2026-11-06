import { act, apiRoute, boolParam } from "@/lib/api/http";
import { str } from "@/lib/api/write";
import { lendBook } from "@/lib/actions/loans";
import { apiLoan, loanSelect } from "@/lib/api/loans";
import { db } from "@/lib/db";

export const GET = apiRoute(async ({ userId, params }) => {
  const open = boolParam(params, "open");
  const rows = await db.loan.findMany({
    where: {
      userId,
      ...(open === true ? { returnedAt: null } : {}),
      ...(open === false ? { returnedAt: { not: null } } : {}),
    },
    orderBy: { lentAt: "desc" },
    take: 200,
    select: loanSelect,
  });
  return { data: rows.map(apiLoan) };
});

export const POST = apiRoute(
  async ({ userId, body }) => {
    const b = await body();
    const created = await act(userId, () =>
      lendBook(str(b, "bookId", true)!, {
        person: str(b, "person", true)!,
        lentAt: str(b, "lentAt") ?? null,
        dueAt: str(b, "dueAt") ?? null,
        note: str(b, "note") ?? null,
      }),
    );
    const row = await db.loan.findUniqueOrThrow({
      where: { id: created!.id },
      select: loanSelect,
    });
    return { data: apiLoan(row) };
  },
  { write: true, status: 201 },
);
