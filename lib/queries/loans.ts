import { db } from "../db";
import { bookSummarySelect, toCover } from "../books";
import { daysBetween, fmtDay, today, toISODay } from "../dates";
import { editionIds } from "../works";

type LoanRow = {
  id: string;
  person: string;
  lentAt: Date;
  dueAt: Date | null;
  returnedAt: Date | null;
  note: string | null;
};

export function shapeLoan(l: LoanRow) {
  const now = today();
  const days = daysBetween(l.lentAt, l.returnedAt ?? now);
  return {
    id: l.id,
    person: l.person,
    note: l.note,
    lentAt: toISODay(l.lentAt),
    dueAt: l.dueAt ? toISODay(l.dueAt) : null,
    returnedAt: l.returnedAt ? toISODay(l.returnedAt) : null,
    lent: fmtDay(l.lentAt),
    due: l.dueAt ? fmtDay(l.dueAt) : null,
    returned: l.returnedAt ? fmtDay(l.returnedAt) : null,
    days,
    overdue: !l.returnedAt && l.dueAt != null && l.dueAt < now,
  };
}

export type LoanItem = ReturnType<typeof shapeLoan>;

export async function getBookLoans(bookId: string, viewerId: string | null) {
  if (!viewerId) return null;
  const ids = await editionIds(bookId);
  const rows = await db.loan.findMany({
    where: { userId: viewerId, bookId: { in: ids } },
    orderBy: { lentAt: "desc" },
    take: 10,
  });
  const loans = rows.map(shapeLoan);
  return {
    open: loans.find((l) => !l.returnedAt) ?? null,
    history: loans.filter((l) => l.returnedAt),
  };
}

export type BookLoans = NonNullable<Awaited<ReturnType<typeof getBookLoans>>>;

export async function getOpenLoans(userId: string) {
  const rows = await db.loan.findMany({
    where: { userId, returnedAt: null },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { lentAt: "asc" }],
    include: { book: { select: bookSummarySelect } },
  });
  return rows.map((l) => ({ ...shapeLoan(l), book: toCover(l.book) }));
}

export async function remindOverdueLoans(now = new Date()) {
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000);
  const due = await db.loan.findMany({
    where: {
      returnedAt: null,
      dueAt: { lt: today() },
      OR: [{ remindedAt: null }, { remindedAt: { lt: twoWeeksAgo } }],
    },
    select: { id: true, userId: true },
    take: 500,
  });
  for (const loan of due) {
    await db.notification.create({
      data: {
        userId: loan.userId,
        actorId: loan.userId,
        kind: "LOAN_DUE",
        loanId: loan.id,
      },
    });
    await db.loan.update({
      where: { id: loan.id },
      data: { remindedAt: now },
    });
  }
  return { reminded: due.length };
}
