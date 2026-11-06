"use server";

import { db } from "../db";
import { isOpenLibraryId } from "../open-library";
import { isAdmin } from "../queries/reports";
import { revalidate } from "../revalidate";
import { fail, withUser } from "./result";

export interface BookEdit {
  title: string;
  subtitle?: string;
  authors: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number | string | null;
  language?: string;
  description?: string;
  coverUrl?: string;
}

const text = (v: unknown, max: number, label: string) => {
  const s = String(v ?? "").trim();
  if (s.length > max) fail(`${label}: no máximo ${max} caracteres.`);
  return s || null;
};

export async function updateBookData(bookId: string, input: BookEdit) {
  return withUser(async (userId) => {
    if (!(await isAdmin(userId))) fail("Sem permissão.");
    if (!isOpenLibraryId(bookId))
      fail(
        "Livros do Google Books não podem ser editados. Troque para a edição do Open Library.",
      );
    const exists = await db.book.findUnique({
      where: { id: bookId },
      select: { id: true },
    });
    if (!exists) fail("Livro não encontrado.");

    const title = text(input.title, 300, "Título");
    if (!title) fail("Informe o título.");
    const authors = String(input.authors ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
      .slice(0, 10);
    if (!authors.length) fail("Informe pelo menos um autor.");
    if (authors.some((a) => a.length > 200))
      fail("Nome de autor longo demais.");
    const publishedDate = text(input.publishedDate, 10, "Ano");
    if (publishedDate && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(publishedDate))
      fail("Use o ano (2024) ou a data (2024-05-10).");
    const rawPages = input.pageCount;
    let pageCount: number | null = null;
    if (
      rawPages !== null &&
      rawPages !== undefined &&
      String(rawPages).trim()
    ) {
      pageCount = Number(rawPages);
      if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > 20000)
        fail("Informe um número de páginas válido.");
    }
    const coverUrl = text(input.coverUrl, 500, "Capa");
    if (coverUrl && !/^https:\/\/covers\.openlibrary\.org\/b\//.test(coverUrl))
      fail(
        "Use uma capa do Open Library (https://covers.openlibrary.org/b/…).",
      );
    const language = text(input.language, 10, "Idioma");

    await db.book.update({
      where: { id: bookId },
      data: {
        title,
        subtitle: text(input.subtitle, 300, "Subtítulo"),
        authors,
        publisher: text(input.publisher, 200, "Editora"),
        publishedDate,
        pageCount,
        language,
        description: text(input.description, 8000, "Sinopse"),
        coverUrl,
        curatedAt: new Date(),
        curatedById: userId,
      },
    });
    revalidate();
  });
}

export async function releaseBookCuration(bookId: string) {
  return withUser(async (userId) => {
    if (!(await isAdmin(userId))) fail("Sem permissão.");
    await db.book.update({
      where: { id: bookId },
      data: { curatedAt: null, curatedById: null, syncedAt: new Date(0) },
    });
    revalidate();
  });
}
