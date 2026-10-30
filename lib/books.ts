import { cache } from "react";
import { db } from "./db";
import { bestCover } from "./cover-probe";
import { linkWork } from "./works";
import { coverUrl, getVolume } from "./google-books";
import { getOpenLibraryBook, isOpenLibraryId } from "./open-library";
import type { Book as BookRow } from "./generated/prisma/client";
import type { Book as CoverBook, GoogleBooksVolume } from "./types/book";

const PALETTES = [
  { bg: "#2A2920", fg: "#FFF8D5" },
  { bg: "#5B3A1E", fg: "#F8E99D" },
  { bg: "#1E3A3A", fg: "#FFE767" },
  { bg: "#7A2F1F", fg: "#FFE767" },
  { bg: "#0F2A4A", fg: "#FFF8D5" },
  { bg: "#B5522E", fg: "#FFF1D6" },
  { bg: "#2F4A5E", fg: "#F8E99D" },
  { bg: "#2E2A1E", fg: "#FFE767" },
  { bg: "#4F4030", fg: "#FFF8D5" },
  { bg: "#8A4B22", fg: "#FFF8D5" },
  { bg: "#1F4030", fg: "#F8E99D" },
  { bg: "#3A1F40", fg: "#FFE767" },
  { bg: "#5E5F27", fg: "#FFF8D5" },
  { bg: "#552020", fg: "#FFE767" },
];

const GLYPHS = ["♁", "✶", "★", "≈", "✦", "○", "▲", "◇", "✿", "▼", "◐", "❀"];

function hashIndex(str: string, len: number) {
  let h = 0;
  for (const c of str) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h) % len;
}

export type BookSummary = Pick<
  BookRow,
  "id" | "title" | "authors" | "pageCount" | "coverUrl" | "publisher"
>;

export const bookSummarySelect = {
  id: true,
  title: true,
  authors: true,
  pageCount: true,
  coverUrl: true,
  publisher: true,
} as const;

export function toCover(book: BookSummary): CoverBook {
  return {
    id: book.id,
    title: book.title,
    author: book.authors[0] ?? "Autor desconhecido",
    pages: book.pageCount ?? 0,
    glyph: GLYPHS[hashIndex(book.id, GLYPHS.length)],
    palette: {
      ...PALETTES[hashIndex(book.id, PALETTES.length)],
      pub: book.publisher ?? undefined,
    },
    coverUrl: book.coverUrl ?? undefined,
  };
}

function plainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function dimensionsOf(v: GoogleBooksVolume) {
  const d = v.volumeInfo.dimensions;
  if (!d) return null;
  const num = (x?: string) =>
    x ? Number.parseFloat(x).toLocaleString("pt-BR") : null;
  const w = num(d.width);
  const h = num(d.height);
  const t = num(d.thickness);
  if (w && h && t) return `${w} × ${h} × ${t} cm`;
  if (w && h) return `${w} × ${h} cm`;
  const parts = [
    h && `altura ${h} cm`,
    w && `largura ${w} cm`,
    t && `espessura ${t} cm`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function volumeToRow(v: GoogleBooksVolume) {
  const info = v.volumeInfo;
  const isbn = (type: string) =>
    info.industryIdentifiers?.find((x) => x.type === type)?.identifier ?? null;
  return {
    id: v.id,
    title: info.title,
    subtitle: info.subtitle ?? null,
    authors: info.authors ?? [],
    publisher: info.publisher ?? null,
    publishedDate: info.publishedDate ?? null,
    pageCount: info.pageCount || null,
    language: info.language ?? null,
    categories: info.categories ?? [],
    description: info.description ? plainText(info.description) : null,
    coverUrl: coverUrl(v) ?? null,
    isbn10: isbn("ISBN_10"),
    isbn13: isbn("ISBN_13"),
    dimensions: dimensionsOf(v),
    googleRating: info.averageRating ?? null,
    googleRatingsCount: info.ratingsCount ?? null,
  };
}

export type BookData = ReturnType<typeof volumeToRow> & { syncedAt: Date };

const OPEN_DATA_STALE_MS = 30 * 86_400_000;
const GOOGLE_STALE_MS = 86_400_000;

async function fetchRow(id: string) {
  if (!isOpenLibraryId(id)) return volumeToRow(await getVolume(id));
  const row = await getOpenLibraryBook(id);
  if (!row) throw new Error(`Open Library edition ${id} not found`);
  return row;
}

async function syncBook(id: string, persist: boolean) {
  const openData = isOpenLibraryId(id);
  const staleMs = openData ? OPEN_DATA_STALE_MS : GOOGLE_STALE_MS;
  const cached = await db.book.findUnique({ where: { id } });
  if (cached && Date.now() - cached.syncedAt.getTime() < staleMs) {
    if (!cached.workId)
      cached.workId = await linkWork(cached).catch(() => null);
    return { cached, fresh: cached };
  }
  try {
    const row = await fetchRow(id);
    const data = {
      ...row,
      pageCount: row.pageCount ?? cached?.pageCount ?? null,
      coverUrl: await bestCover(row.coverUrl),
      syncedAt: new Date(),
    };
    const fallback = {
      ...data,
      createdAt: cached?.createdAt ?? new Date(),
      workId: cached?.workId ?? null,
    };
    const shouldSave = openData || persist || cached != null;
    const fresh = shouldSave
      ? await db.book
          .upsert({ where: { id }, create: data, update: data })
          .catch(() => fallback)
      : fallback;
    if (shouldSave && !fresh.workId)
      fresh.workId = await linkWork(fresh).catch(() => null);
    return { cached, fresh };
  } catch (err) {
    return { cached, fresh: null, err };
  }
}

export const loadBook = cache(async (id: string): Promise<BookData | null> => {
  const { cached, fresh } = await syncBook(id, false);
  return fresh ?? cached;
});

export async function ensureBook(id: string) {
  const { cached, fresh, err } = await syncBook(id, true);
  if (fresh) return fresh;
  if (cached) return cached;
  throw err ?? new Error(`Book ${id} not found`);
}

export function languageLabel(code: string | null) {
  if (!code) return null;
  const names: Record<string, string> = {
    pt: "Português",
    "pt-BR": "Português (Brasil)",
    "pt-PT": "Português (Portugal)",
    en: "Inglês",
    es: "Espanhol",
    fr: "Francês",
    it: "Italiano",
    de: "Alemão",
  };
  return names[code] ?? code;
}

export function yearOf(publishedDate: string | null) {
  return publishedDate?.slice(0, 4) ?? null;
}

const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function fmtPublished(publishedDate: string | null) {
  if (!publishedDate) return null;
  const [y, m, d] = publishedDate.split("-");
  if (!m) return y;
  const month = MONTHS[Number(m) - 1];
  if (!d || (d === "01" && m === "01")) return d ? y : `${month} ${y}`;
  return `${Number(d)} ${month} ${y}`;
}
