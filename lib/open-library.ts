import { authorSurname, normalize, workKey } from "./editions";

const API_BASE = "https://openlibrary.org";
const COVERS_BASE = "https://covers.openlibrary.org";
const USER_AGENT = "Trapiche/0.1 (david.queiroz@dnowdd.com)";

const LANGUAGES: Record<string, string> = {
  por: "pt",
  eng: "en",
  spa: "es",
  fre: "fr",
  ita: "it",
  ger: "de",
};

type TextValue = string | { value: string };

interface OLEdition {
  key: string;
  title: string;
  subtitle?: string;
  publishers?: string[];
  publish_date?: string;
  number_of_pages?: number;
  languages?: { key: string }[];
  isbn_10?: string[];
  isbn_13?: string[];
  covers?: number[];
  description?: TextValue;
  physical_dimensions?: string;
  authors?: { key: string }[];
  works?: { key: string }[];
}

interface OLWork {
  key: string;
  title: string;
  description?: TextValue;
  authors?: { author: { key: string } }[];
}

export function isOpenLibraryId(id: string) {
  return /^OL\d+M$/.test(id);
}

async function olFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function toIsbn13(isbn: string | null | undefined) {
  if (!isbn) return null;
  const clean = isbn.replace(/[^0-9X]/gi, "").toUpperCase();
  if (clean.length === 13) return clean;
  if (clean.length !== 10) return null;
  const core = `978${clean.slice(0, 9)}`;
  const sum = [...core].reduce(
    (s, d, i) => s + Number(d) * (i % 2 === 0 ? 1 : 3),
    0,
  );
  return `${core}${(10 - (sum % 10)) % 10}`;
}

function text(v?: TextValue) {
  if (!v) return null;
  return typeof v === "string" ? v : v.value;
}

function year(date?: string) {
  return date?.match(/\b(1[5-9]|20)\d{2}\b/)?.[0] ?? null;
}

function idOf(key: string) {
  return key.split("/").pop()!;
}

async function authorNames(keys: string[]) {
  const authors = await Promise.all(
    keys.slice(0, 3).map((k) => olFetch<{ name?: string }>(`${k}.json`)),
  );
  return authors.map((a) => a?.name).filter((n): n is string => Boolean(n));
}

function editionToRow(
  e: OLEdition,
  authors: string[],
  workDescription?: string | null,
) {
  const lang = e.languages?.[0]?.key.split("/").pop();
  const cover = e.covers?.find((c) => c > 0);
  return {
    id: idOf(e.key),
    title: e.title,
    subtitle: e.subtitle ?? null,
    authors,
    publisher: e.publishers?.[0] ?? null,
    publishedDate: year(e.publish_date),
    pageCount: e.number_of_pages || null,
    language: lang ? (LANGUAGES[lang] ?? lang) : null,
    categories: [] as string[],
    description: text(e.description) ?? workDescription ?? null,
    coverUrl: cover ? `${COVERS_BASE}/b/id/${cover}-L.jpg` : null,
    isbn10: e.isbn_10?.[0] ?? null,
    isbn13: e.isbn_13?.[0] ?? toIsbn13(e.isbn_10?.[0]),
    dimensions: e.physical_dimensions ?? null,
    googleRating: null,
    googleRatingsCount: null,
  };
}

export type OpenLibraryRow = ReturnType<typeof editionToRow>;

export async function getOpenLibraryBook(id: string) {
  const edition = await olFetch<OLEdition>(`/books/${id}.json`);
  if (!edition) return null;
  const work = edition.works?.[0]
    ? await olFetch<OLWork>(`${edition.works[0].key}.json`)
    : null;
  const authorKeys =
    edition.authors?.map((a) => a.key) ??
    work?.authors?.map((a) => a.author.key) ??
    [];
  return editionToRow(
    edition,
    await authorNames(authorKeys),
    text(work?.description),
  );
}

async function workByIsbn(isbns: string[]) {
  for (const isbn of isbns.slice(0, 3)) {
    const edition = await olFetch<OLEdition>(`/isbn/${isbn}.json`);
    if (edition?.works?.[0]) return edition.works[0].key;
  }
  return null;
}

async function workBySearch(title: string, author?: string) {
  const params = new URLSearchParams({
    title,
    fields: "key,title,author_name",
    limit: "10",
  });
  if (author) params.set("author", authorSurname(author));
  const res = await olFetch<{
    docs: { key: string; title: string; author_name?: string[] }[];
  }>(`/search.json?${params}`);
  const key = workKey(title, author);
  return (
    res?.docs.find(
      (d) =>
        workKey(d.title, d.author_name?.[0]) === key ||
        (normalize(d.title) === normalize(title) &&
          d.author_name?.some(
            (a) => authorSurname(a) === authorSurname(author),
          )),
    )?.key ?? null
  );
}

export async function findOpenLibraryEditions({
  title,
  author,
  isbns,
}: {
  title: string;
  author?: string;
  isbns: string[];
}): Promise<OpenLibraryRow[]> {
  const workPath =
    (await workByIsbn(isbns)) ?? (await workBySearch(title, author));
  if (!workPath) return [];
  const res = await olFetch<{ entries: OLEdition[] }>(
    `${workPath}/editions.json?limit=50`,
  );
  const authors = author ? [author] : [];
  return (res?.entries ?? [])
    .filter((e) => e.publishers?.length && (e.isbn_13 || e.isbn_10))
    .map((e) => editionToRow(e, authors));
}
