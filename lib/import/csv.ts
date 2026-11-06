import { normalize } from "../editions";

function toIsbn13(clean: string) {
  if (clean.length === 13) return clean;
  const core = `978${clean.slice(0, 9)}`;
  const sum = [...core].reduce(
    (s, d, i) => s + Number(d) * (i % 2 === 0 ? 1 : 3),
    0,
  );
  return `${core}${(10 - (sum % 10)) % 10}`;
}

export type ImportShelf =
  "WANT" | "READING" | "READ" | "ABANDONED" | "REREADING";
export type ImportSourceKind = "GOODREADS" | "SKOOB" | "CSV";

export interface ParsedRow {
  title: string;
  author: string | null;
  isbn: string | null;
  shelf: ImportShelf | null;
  rating: number | null;
  review: string | null;
  dateRead: string | null;
  tags: string[];
}

export const MAX_IMPORT_ROWS = 5000;

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const delimiter = detectDelimiter(src);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"' && field === "") quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

function detectDelimiter(src: string) {
  const firstLine = src.slice(0, src.search(/\r?\n/) >>> 0 || src.length);
  const counts = [",", ";", "\t"].map((d) => ({
    d,
    n: firstLine.split(d).length,
  }));
  return counts.sort((a, b) => b.n - a.n)[0].d;
}

const key = (h: string) => normalize(h).replace(/\s+/g, " ");

const ALIASES: Record<keyof ParsedRow | "isbn10" | "status", string[]> = {
  title: ["title", "titulo", "nome", "livro", "book", "nome do livro"],
  author: ["author", "autor", "autora", "autores", "authors", "escritor"],
  isbn: ["isbn13", "isbn 13", "isbn"],
  isbn10: ["isbn10", "isbn 10"],
  shelf: ["exclusive shelf", "estante", "status", "situacao", "shelf"],
  status: ["tipo", "leitura"],
  rating: [
    "my rating",
    "avaliacao",
    "nota",
    "rating",
    "minha nota",
    "estrelas",
  ],
  review: ["my review", "resenha", "review", "comentario", "minha resenha"],
  dateRead: [
    "date read",
    "data de leitura",
    "lido em",
    "data lido",
    "terminei em",
    "data de conclusao",
    "data",
  ],
  tags: ["bookshelves", "tags", "etiquetas", "prateleiras", "marcadores"],
};

function columnIndex(headers: string[], names: string[]) {
  const keys = headers.map(key);
  for (const n of names) {
    const i = keys.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
}

export function detectSource(headers: string[]): ImportSourceKind {
  const keys = headers.map(key);
  if (keys.includes("exclusive shelf") || keys.includes("bookshelves"))
    return "GOODREADS";
  if (keys.some((k) => ["titulo", "autor", "estante", "nota"].includes(k)))
    return "SKOOB";
  return "CSV";
}

const SHELF_WORDS: [RegExp, ImportShelf][] = [
  [/^(read|lido|lidos|li|concluido|terminado|finalizado)$/, "READ"],
  [
    /^(currently reading|currently-reading|lendo|leitura atual|em andamento)$/,
    "READING",
  ],
  [
    /^(to read|to-read|quero ler|vou ler|desejado|desejo|wishlist|pilha)$/,
    "WANT",
  ],
  [/^(relendo|relendo agora|rereading|re reading)$/, "REREADING"],
  [
    /^(abandonei|abandonado|abandonados|did not finish|did-not-finish|dnf|parei)$/,
    "ABANDONED",
  ],
];

export function mapShelf(raw: string | undefined): ImportShelf | null {
  if (!raw?.trim()) return null;
  const k = normalize(raw).replace(/-/g, " ").trim();
  for (const [re, shelf] of SHELF_WORDS) if (re.test(k)) return shelf;
  return null;
}

const GOODREADS_BUILTIN = new Set([
  "read",
  "to-read",
  "currently-reading",
  "did-not-finish",
  "favorites",
]);

function parseRating(raw: string | undefined) {
  if (!raw?.trim()) return null;
  const n = Number(raw.replace(",", ".").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  const scaled = n > 5 ? n / 2 : n;
  return Math.min(5, Math.max(0.5, Math.round(scaled * 2) / 2));
}

export function parseDate(raw: string | undefined): string | null {
  const s = raw?.trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) return iso(+m[3], +m[2], +m[1]);
  m = s.match(/^(\d{4})$/);
  if (m) return iso(+m[1], 12, 31);
  return null;
}

function iso(y: number, mo: number, d: number) {
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCMonth() !== mo - 1) return null;
  return date.toISOString().slice(0, 10);
}

function cleanIsbn(raw: string | undefined) {
  const digits = (raw ?? "").replace(/[^0-9Xx]/g, "").toUpperCase();
  if (digits.length !== 10 && digits.length !== 13) return null;
  return toIsbn13(digits);
}

function cleanReview(raw: string | undefined) {
  if (!raw?.trim()) return null;
  const text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text ? text.slice(0, 5000) : null;
}

export function mapRows(table: string[][]): {
  source: ImportSourceKind;
  rows: ParsedRow[];
  missingTitle: boolean;
} {
  const [headers = [], ...body] = table;
  const source = detectSource(headers);
  const col = (k: keyof typeof ALIASES) => columnIndex(headers, ALIASES[k]);
  const c = {
    title: col("title"),
    author: col("author"),
    isbn: col("isbn"),
    isbn10: col("isbn10"),
    shelf: col("shelf"),
    status: col("status"),
    rating: col("rating"),
    review: col("review"),
    dateRead: col("dateRead"),
    tags: col("tags"),
  };
  if (c.title < 0) return { source, rows: [], missingTitle: true };
  const get = (r: string[], i: number) => (i >= 0 ? r[i] : undefined);

  const rows = body.slice(0, MAX_IMPORT_ROWS).flatMap((r) => {
    const title = get(r, c.title)?.trim();
    if (!title) return [];
    const dateRead = parseDate(get(r, c.dateRead));
    let shelf = mapShelf(get(r, c.shelf)) ?? mapShelf(get(r, c.status));
    const rawTags = (get(r, c.tags) ?? "")
      .split(/[,;|]/)
      .map((t) => t.replace(/\(#\d+\)$/, "").trim())
      .filter(Boolean);
    if (!shelf) shelf = rawTags.map(mapShelf).find(Boolean) ?? null;
    if (!shelf && dateRead) shelf = "READ";
    const tags = rawTags
      .filter((t) => !GOODREADS_BUILTIN.has(t.toLowerCase()) && !mapShelf(t))
      .map((t) => t.replace(/-/g, " ").slice(0, 32))
      .slice(0, 10);
    return [
      {
        title: title.slice(0, 300),
        author: get(r, c.author)?.split(/[;,]/)[0].trim().slice(0, 200) || null,
        isbn: cleanIsbn(get(r, c.isbn)) ?? cleanIsbn(get(r, c.isbn10)),
        shelf,
        rating: parseRating(get(r, c.rating)),
        review: cleanReview(get(r, c.review)),
        dateRead,
        tags: [...new Set(tags)],
      },
    ];
  });
  return { source, rows, missingTitle: false };
}

export const TEMPLATE_CSV =
  "titulo;autor;isbn;estante;nota;data de leitura;resenha;tags\n" +
  "Grande Sertão: Veredas;João Guimarães Rosa;9788535908770;lido;5;2024-03-10;Uma travessia.;clássicos, pra reler\n" +
  "Torto Arado;Itamar Vieira Junior;;quero ler;;;;clube do livro\n";
