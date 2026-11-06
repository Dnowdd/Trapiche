"use server";

import { db } from "../db";
import { ensureBook } from "../books";
import { today, toISODay } from "../dates";
import { revalidate } from "../revalidate";
import { fail, throttle, withUser } from "./result";

export interface LoanInput {
  person: string;
  lentAt?: string | null;
  dueAt?: string | null;
  note?: string | null;
}

function parseDay(raw: string | null | undefined, label: string) {
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) fail(`Data inválida em ${label}.`);
  const date = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || toISODay(date) !== raw)
    fail(`Data inválida em ${label}.`);
  return date;
}

function parseLoan(input: LoanInput) {
  const person = String(input.person ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!person) fail("Diga para quem você emprestou.");
  if (person.length > 80) fail("O nome pode ter no máximo 80 caracteres.");
  const lentAt = parseDay(input.lentAt, "emprestado em") ?? today();
  if (lentAt > today()) fail("A data do empréstimo não pode ser no futuro.");
  const dueAt = parseDay(input.dueAt, "devolver até");
  if (dueAt && dueAt < lentAt)
    fail("A devolução precisa ser depois do empréstimo.");
  const note = String(input.note ?? "").trim();
  if (note.length > 300) fail("A nota pode ter no máximo 300 caracteres.");
  return { person, lentAt, dueAt, note: note || null };
}

export async function lendBook(bookId: string, input: LoanInput) {
  return withUser(async (userId) => {
    await throttle(userId, "loan", 60, 3_600_000);
    const data = parseLoan(input);
    await ensureBook(bookId);
    const open = await db.loan.findFirst({
      where: { userId, bookId, returnedAt: null },
      select: { person: true },
    });
    if (open) fail(`Esse livro já está com ${open.person}.`);
    const loan = await db.loan.create({
      data: { ...data, userId, bookId },
      select: { id: true },
    });
    revalidate();
    return loan;
  });
}

export async function updateLoan(loanId: string, input: LoanInput) {
  return withUser(async (userId) => {
    const data = parseLoan(input);
    const { count } = await db.loan.updateMany({
      where: { id: loanId, userId },
      data: { ...data, remindedAt: null },
    });
    if (!count) fail("Empréstimo não encontrado.");
    revalidate();
  });
}

export async function returnLoan(loanId: string, returnedAt?: string | null) {
  return withUser(async (userId) => {
    const loan = await db.loan.findFirst({
      where: { id: loanId, userId },
      select: { lentAt: true, returnedAt: true },
    });
    if (!loan) fail("Empréstimo não encontrado.");
    if (loan.returnedAt) return;
    const date = parseDay(returnedAt, "devolvido em") ?? today();
    if (date < loan.lentAt)
      fail("A devolução precisa ser depois do empréstimo.");
    if (date > today()) fail("A devolução não pode ser no futuro.");
    await db.loan.update({
      where: { id: loanId },
      data: { returnedAt: date },
    });
    await db.notification.deleteMany({ where: { loanId } });
    revalidate();
  });
}

export async function deleteLoan(loanId: string) {
  return withUser(async (userId) => {
    await db.loan.deleteMany({ where: { id: loanId, userId } });
    revalidate();
  });
}
