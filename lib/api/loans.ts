import { db } from "../db";
import { shapeLoan } from "../queries/loans";
import { ApiError } from "./http";
import { apiBook, apiBookSelect } from "./serialize";

export const loanSelect = {
  id: true,
  person: true,
  lentAt: true,
  dueAt: true,
  returnedAt: true,
  note: true,
  book: { select: apiBookSelect },
} as const;

type Row = {
  id: string;
  person: string;
  lentAt: Date;
  dueAt: Date | null;
  returnedAt: Date | null;
  note: string | null;
  book: Parameters<typeof apiBook>[0];
};

export function apiLoan(r: Row) {
  const s = shapeLoan(r);
  return {
    id: s.id,
    person: s.person,
    note: s.note,
    lentAt: s.lentAt,
    dueAt: s.dueAt,
    returnedAt: s.returnedAt,
    days: s.days,
    overdue: s.overdue,
    book: apiBook(r.book),
  };
}

export async function ownLoan(userId: string, id: string) {
  const row = await db.loan.findFirst({
    where: { id, userId },
    select: loanSelect,
  });
  if (!row) throw new ApiError(404, "not_found", "Empréstimo não encontrado.");
  return row;
}
