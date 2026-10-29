import { cachedJson, HttpError, markUnavailable } from "./api-cache";
import { authorSurname, normalize, workKey } from "./editions";
import type { GoogleBooksVolume } from "./types/book";

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
    return await cachedJson<T>(
      `${API_BASE}${path}`,
      { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } },
      (data) => {
        const docs = (data as { docs?: unknown[] }).docs;
        const entries = (data as { entries?: unknown[] }).entries;
        return (docs ?? entries ?? [1]).length > 0;
      },
    );
  } catch (err) {
    if (err instanceof HttpError && err.status >= 500)
      markUnavailable(`${API_BASE}${path}`);
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

interface OLAuthor {
  name?: string;
  bio?: TextValue;
  birth_date?: string;
  death_date?: string;
  photos?: number[];
}

const PT_HINTS =
  /\b(foi|nasceu|escritora?|brasileir[oa]|romances?|obras?|autora?)\b/gi;

function pickBio(raw: string | null) {
  if (!raw) return null;
  const parts = raw
    .split(/\n\s*-{4,}\s*\n/)
    .map((p) =>
      p
        .split("\n")
        .filter((l) => !/^\s*\[\d+\]:/.test(l))
        .join("\n")
        .replace(/\(\[[^\]]*\]\[\d+\]\)/g, "")
        .replace(/\[([^\]]+)\]\[\d+\]/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/(\*\*|\*|__|_)([^*_\n]+)\1/g, "$2")
        .trim(),
    )
    .filter(Boolean);
  if (!parts.length) return null;
  const score = (p: string) => p.match(PT_HINTS)?.length ?? 0;
  return parts.reduce((best, p) => (score(p) > score(best) ? p : best));
}

export async function getAuthorProfile(name: string) {
  const params = new URLSearchParams({ q: name, limit: "10" });
  const res = await olFetch<{
    docs: { key: string; name: string; work_count?: number }[];
  }>(`/search/authors.json?${params}`);
  const match = res?.docs
    .filter((d) => normalize(d.name) === normalize(name))
    .sort((a, b) => (b.work_count ?? 0) - (a.work_count ?? 0))[0];
  if (!match) return null;
  const author = await olFetch<OLAuthor>(`/authors/${match.key}.json`);
  if (!author) return null;
  const photo = author.photos?.find((p) => p > 0);
  return {
    born: year(author.birth_date),
    died: year(author.death_date),
    bio: pickBio(text(author.bio)),
    photoUrl: photo ? `${COVERS_BASE}/a/id/${photo}-L.jpg` : null,
  };
}

const PUBLISHER_NOISE =
  /\b(editora|editorial|edicoes|edições|publicacoes|publicações|livros|ltda|s\.?a\.?|grupo)\b/gi;

export function publisherCore(name: string) {
  return name.replace(PUBLISHER_NOISE, " ").replace(/\s+/g, " ").trim() || name;
}

export async function findPublisherWorks(publisher: string, limit = 100) {
  const core = publisherCore(publisher);
  const params = new URLSearchParams({
    q: `publisher:"${core}"`,
    lang: "por",
    limit: String(limit),
    fields:
      "key,title,author_name,edition_count,first_publish_year,editions,editions.key,editions.title,editions.publisher,editions.cover_i,editions.publish_date",
  });
  const res = await olFetch<{ docs: OLSearchDoc[] }>(`/search.json?${params}`);
  const wanted = normalize(core);
  return (res?.docs ?? [])
    .flatMap((d) => {
      const e = d.editions?.docs[0];
      const own = e?.publisher?.some((p) => {
        const n = normalize(p);
        return n.includes(wanted) || wanted.includes(n);
      });
      if (!e || !own) return [];
      return [
        {
          id: idOf(e.key),
          title: e.title ?? d.title,
          author: d.author_name?.[0] ?? null,
          year:
            year(e.publish_date?.[0]) ??
            (d.first_publish_year ? String(d.first_publish_year) : null),
          coverUrl: e.cover_i ? `${COVERS_BASE}/b/id/${e.cover_i}-L.jpg` : null,
          popularity: d.edition_count ?? 0,
        },
      ];
    })
    .sort((a, b) => b.popularity - a.popularity);
}

const PLACEHOLDER_AUTHOR =
  /^\[.*\]$|not identified|unknown|desconhecid|anonymous|anônimo|anonimo/i;

interface OLSearchDoc {
  key?: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  edition_count?: number;
  editions?: {
    docs: {
      key: string;
      title?: string;
      language?: string[];
      publisher?: string[];
      cover_i?: number;
      isbn?: string[];
      publish_date?: string[];
    }[];
  };
}

export async function searchOpenLibrary(
  query: string,
  limit = 20,
): Promise<GoogleBooksVolume[]> {
  const params = new URLSearchParams({
    q: query,
    lang: "por",
    limit: String(limit),
    fields:
      "key,title,author_name,first_publish_year,edition_count,editions,editions.key,editions.title,editions.language,editions.publisher,editions.cover_i,editions.isbn,editions.publish_date",
  });
  const res = await olFetch<{ docs: OLSearchDoc[] }>(`/search.json?${params}`);
  return (res?.docs ?? []).flatMap((d) => {
    const e = d.editions?.docs[0];
    const authors = d.author_name?.filter((a) => !PLACEHOLDER_AUTHOR.test(a));
    if (!e || !authors?.length) return [];
    if (!e.cover_i && !e.isbn?.length) return [];
    const isbn13 = e.isbn?.map(toIsbn13).find(Boolean);
    return [
      {
        id: idOf(e.key),
        volumeInfo: {
          title: e.title ?? d.title,
          authors,
          publisher: e.publisher?.[0],
          publishedDate:
            year(e.publish_date?.[0]) ??
            (d.first_publish_year ? String(d.first_publish_year) : undefined),
          language: e.language?.includes("por") ? "pt" : e.language?.[0],
          imageLinks: e.cover_i
            ? { thumbnail: `${COVERS_BASE}/b/id/${e.cover_i}-L.jpg` }
            : undefined,
          industryIdentifiers: isbn13
            ? [{ type: "ISBN_13", identifier: isbn13 }]
            : undefined,
          workEditions: d.edition_count,
          olWork: d.key,
          olWorkTitle: d.title,
        },
      } as GoogleBooksVolume,
    ];
  });
}

export async function searchOpenLibraryPt(query: string, limit = 40) {
  const [pt, any] = await Promise.all([
    searchOpenLibrary(`${query} language:por`, limit).catch(() => []),
    searchOpenLibrary(query, limit).catch(() => []),
  ]);
  const seen = new Set(pt.map((v) => v.volumeInfo.olWork));
  return [...pt, ...any.filter((v) => !seen.has(v.volumeInfo.olWork))];
}

export function withoutOpenLibraryDuplicates(
  openLibrary: GoogleBooksVolume[],
  others: GoogleBooksVolume[],
  author?: string,
) {
  const tokensOf = (title: string) =>
    workKey(title, author).split("|")[0].split(" ").filter(Boolean);
  const known = openLibrary.flatMap((v) =>
    [v.volumeInfo.title, v.volumeInfo.olWorkTitle]
      .filter((t): t is string => Boolean(t))
      .map(tokensOf)
      .filter((t) => t.length > 0),
  );
  return others.filter((v) => {
    const own = new Set(tokensOf(v.volumeInfo.title));
    return !known.some((k) => k.every((t) => own.has(t)));
  });
}

export async function searchOpenLibraryAuthors(query: string, limit = 3) {
  const tokens = normalize(query)
    .split(" ")
    .filter((t) => t.length > 1);
  if (!tokens.length) return [];
  const params = new URLSearchParams({ q: query, limit: "10" });
  const res = await olFetch<{
    docs: { name: string; work_count?: number }[];
  }>(`/search/authors.json?${params}`);
  const best = new Map<string, { name: string; works: number }>();
  for (const d of res?.docs ?? []) {
    const n = normalize(d.name);
    const works = d.work_count ?? 0;
    if (works < 2) continue;
    if (!tokens.every((t) => n.split(" ").some((w) => w.startsWith(t))))
      continue;
    if ((best.get(n)?.works ?? 0) < works) best.set(n, { name: d.name, works });
  }
  return [...best.values()].sort((a, b) => b.works - a.works).slice(0, limit);
}

export async function editionIdByIsbn(isbn: string) {
  const edition = await olFetch<OLEdition>(`/isbn/${isbn}.json`);
  return edition?.key ? idOf(edition.key) : null;
}
