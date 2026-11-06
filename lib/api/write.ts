import { db } from "../db";
import { editionIds } from "../works";
import { ApiError, badParam } from "./http";
import { apiBook, apiBookSelect, iso } from "./serialize";

type Body = Record<string, unknown>;

export function str(body: Body, name: string, required = false) {
  const v = body[name];
  if (v === undefined || v === null) {
    if (required) throw badParam(name, "obrigatório.");
    return undefined;
  }
  if (typeof v !== "string") throw badParam(name, "use um texto.");
  return v;
}

export function num(body: Body, name: string, required = false) {
  const v = body[name];
  if (v === undefined || v === null || v === "") {
    if (required) throw badParam(name, "obrigatório.");
    return undefined;
  }
  if (typeof v !== "number" || !Number.isFinite(v))
    throw badParam(name, "use um número.");
  return v;
}

export function bool(body: Body, name: string, required = false) {
  const v = body[name];
  if (v === undefined || v === null) {
    if (required) throw badParam(name, "obrigatório.");
    return undefined;
  }
  if (typeof v !== "boolean") throw badParam(name, "use true ou false.");
  return v;
}

export function oneOf<T extends string>(
  body: Body,
  name: string,
  allowed: readonly T[],
  required = false,
) {
  const v = str(body, name, required);
  if (v === undefined) return undefined;
  if (!allowed.includes(v as T))
    throw badParam(name, `valores aceitos: ${allowed.join(", ")}.`);
  return v as T;
}

export function strArray(body: Body, name: string) {
  const v = body[name];
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string"))
    throw badParam(name, "use uma lista de textos.");
  return v as string[];
}

export async function shelfItem(userId: string, bookId: string) {
  const ids = await editionIds(bookId);
  const entry = await db.userBook.findFirst({
    where: { userId, bookId: { in: ids } },
    orderBy: { updatedAt: "desc" },
    select: {
      status: true,
      statusChangedAt: true,
      createdAt: true,
      liked: true,
      favoritePosition: true,
      currentPage: true,
      book: { select: apiBookSelect },
      tags: {
        select: { tag: { select: { id: true, name: true, color: true } } },
      },
    },
  });
  if (!entry) throw new ApiError(404, "not_found", "Livro fora da estante.");
  return {
    data: {
      status: entry.status,
      statusChangedAt: iso(entry.statusChangedAt),
      addedAt: iso(entry.createdAt),
      liked: entry.liked,
      favoritePosition: entry.favoritePosition,
      currentPage: entry.currentPage,
      tags: entry.tags.map((t) => t.tag),
      book: apiBook(entry.book),
    },
  };
}
