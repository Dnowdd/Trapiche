"use server";

import { refresh } from "next/cache";
import { db } from "../db";
import { ensureBook } from "../books";
import { linkWork } from "../works";
import { placeInSeries } from "../series";
import { fail, withUser } from "./result";
import { isAdmin } from "../queries/reports";

async function adminWork(userId: string, bookId: string) {
  if (!(await isAdmin(userId))) fail("Sem permissão.");
  const book = await ensureBook(bookId);
  const workId = await linkWork(book);
  if (!workId) fail("Esse livro ainda não tem uma obra vinculada.");
  return workId;
}

export async function setBookSeries(
  bookId: string,
  input: { name: string; position: number | string; description?: string },
) {
  return withUser(async (userId) => {
    const workId = await adminWork(userId, bookId);
    const name = String(input.name ?? "")
      .replace(/\s+/g, " ")
      .trim();
    if (name.length < 2 || name.length > 120)
      fail("O nome da série precisa ter de 2 a 120 caracteres.");
    const position = Number(String(input.position).replace(",", "."));
    if (!Number.isFinite(position) || position <= 0 || position > 999)
      fail("Informe a posição do livro na série (ex.: 1, 2, 2.5).");
    const series = await placeInSeries(workId, name, position);
    const description = String(input.description ?? "").trim();
    if (description.length > 1000)
      fail("A descrição pode ter no máximo 1000 caracteres.");
    if (input.description !== undefined)
      await db.series.update({
        where: { id: series.id },
        data: { description: description || null },
      });
    refresh();
    return { slug: series.slug };
  });
}

export async function removeBookFromSeries(bookId: string) {
  return withUser(async (userId) => {
    const workId = await adminWork(userId, bookId);
    await db.seriesWork.deleteMany({ where: { workId } });
    await db.series.deleteMany({ where: { works: { none: {} } } });
    refresh();
  });
}
