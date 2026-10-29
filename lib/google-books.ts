import type {
  Book,
  BookPalette,
  GoogleBooksResponse,
  GoogleBooksVolume,
} from "./types/book";
import {
  cachedJson,
  GOOGLE_TTL,
  HttpError,
  markUnavailable,
} from "./api-cache";
import { sharpCover } from "./cover-url";
import {
  searchOpenLibrary,
  searchOpenLibraryAuthors,
  searchOpenLibraryPt,
  toIsbn13,
} from "./open-library";
import {
  authorSurname,
  groupWorks,
  queryMatch,
  sameWork,
  sortEditions,
  type Work,
} from "./editions";

const API_BASE = "https://www.googleapis.com/books/v1";

function getKey() {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (!key) throw new Error("GOOGLE_BOOKS_API_KEY not set");
  return key;
}

export function coverUrl(volume: GoogleBooksVolume): string | undefined {
  const links = volume.volumeInfo.imageLinks;
  if (!links) return undefined;
  const url =
    links.large ??
    links.medium ??
    links.small ??
    links.thumbnail ??
    links.smallThumbnail;
  return url ? sharpCover(url, 4) : undefined;
}

const DEGRADED_MS = 60_000;
let degradedUntil = 0;

async function googleJson<T>(
  url: string,
  accept: (data: T) => boolean,
): Promise<T | null> {
  const maxAttempts = Date.now() < degradedUntil ? 1 : 3;
  for (let attempt = 1; ; attempt++) {
    try {
      return await cachedJson<T>(url, {}, accept, GOOGLE_TTL);
    } catch (err) {
      const retryable =
        err instanceof HttpError && (err.status >= 500 || err.status === 429);
      if (retryable) degradedUntil = Date.now() + DEGRADED_MS;
      if (retryable && attempt >= maxAttempts) markUnavailable(url);
      if (!retryable || attempt >= maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
}

async function fetchVolumes(
  query: string,
  maxResults = 10,
  orderBy: "relevance" | "newest" = "relevance",
  lang?: string,
  startIndex = 0,
): Promise<GoogleBooksVolume[]> {
  const key = getKey();
  const langParam = lang ? `&langRestrict=${encodeURIComponent(lang)}` : "";
  const url = `${API_BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&startIndex=${startIndex}&orderBy=${orderBy}&printType=books${langParam}&key=${key}`;
  const data = await googleJson<GoogleBooksResponse>(
    url,
    (d) => (d.items?.length ?? 0) > 0,
  );
  return (data?.items ?? []).filter((v) => v.volumeInfo?.title);
}

export async function searchPages(
  query: string,
  pages = 3,
): Promise<GoogleBooksVolume[]> {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      fetchVolumes(query, 40, "relevance", undefined, i * 40).catch(
        () => [] as GoogleBooksVolume[],
      ),
    ),
  );
  return results.flat();
}

export async function searchBooks(
  query: string,
  maxResults = 10,
  lang?: string,
): Promise<GoogleBooksVolume[]> {
  return fetchVolumes(query, maxResults, "relevance", lang);
}

export interface SearchAuthor {
  name: string;
  works: number;
}

const SEARCH_TIMEOUT_MS = 4000;
const GOOGLE_RESULTS = 3;
const GOOGLE_WHEN_FEWER_THAN = 3;

export function asIsbn(text: string) {
  const clean = text.replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{13}$/.test(clean) && /^97[89]/.test(clean)) return clean;
  if (/^\d{9}[\dX]$/.test(clean)) return toIsbn13(clean);
  return null;
}

function settle<T>(promise: Promise<T[]>): Promise<T[]> {
  return Promise.race([
    promise.catch(() => [] as T[]),
    new Promise<T[]>((resolve) =>
      setTimeout(() => resolve([]), SEARCH_TIMEOUT_MS),
    ),
  ]);
}

export interface SearchOutcome {
  works: Work[];
  authors: SearchAuthor[];
  google: GoogleBooksVolume[];
}

export async function smartSearch(
  query: string,
  maxResults = 10,
): Promise<SearchOutcome> {
  const q = query.trim();
  const isbn = asIsbn(q);
  const [openLibrary, authors] = await Promise.all([
    settle(
      isbn ? searchOpenLibrary(`isbn:${isbn}`, 5) : searchOpenLibraryPt(q, 20),
    ),
    isbn ? [] : settle(searchOpenLibraryAuthors(q)),
  ]);
  const works = groupWorks(openLibrary, isbn ? "" : q).slice(0, maxResults);
  const strong = works.some(({ main }) => queryMatch(main, q) >= 4);
  const google =
    !strong || works.length < GOOGLE_WHEN_FEWER_THAN - 2
      ? await settle(fetchVolumes(isbn ? `isbn:${isbn}` : q, GOOGLE_RESULTS))
      : [];
  return {
    works,
    authors,
    google: google.slice(0, GOOGLE_RESULTS),
  };
}

export async function findEditions(
  id: string,
  title: string,
  author?: string,
): Promise<GoogleBooksVolume[]> {
  const surname = authorSurname(author);
  const results = await Promise.all([
    fetchVolumes(`${title} ${author ?? ""}`.trim(), 40).catch(
      () => [] as GoogleBooksVolume[],
    ),
    fetchVolumes(
      surname ? `intitle:${title} inauthor:${surname}` : `intitle:${title}`,
      40,
    ).catch(() => [] as GoogleBooksVolume[]),
  ]);
  const vols = results.flat();
  const seen = new Set([id]);
  return sortEditions(
    vols.filter((v) => {
      if (seen.has(v.id) || !v.volumeInfo.publisher) return false;
      if (!sameWork(v, title, author)) return false;
      seen.add(v.id);
      return true;
    }),
  );
}

export async function getBookByIsbn(
  isbn: string,
): Promise<GoogleBooksVolume | null> {
  const items = await fetchVolumes(`isbn:${isbn}`, 1);
  return items[0] ?? null;
}

export async function getBookByQuery(
  title: string,
  author: string,
): Promise<GoogleBooksVolume | null> {
  const items = await fetchVolumes(`intitle:${title}+inauthor:${author}`, 1);
  return items[0] ?? null;
}

export async function getVolume(volumeId: string): Promise<GoogleBooksVolume> {
  const key = getKey();
  const volume = await googleJson<GoogleBooksVolume>(
    `${API_BASE}/volumes/${encodeURIComponent(volumeId)}?key=${key}`,
    (v) => Boolean(v.volumeInfo?.title),
  );
  if (!volume) throw new Error(`Google Books volume ${volumeId} not found`);
  return volume;
}

export function volumeToBook(
  volume: GoogleBooksVolume,
  overrides: { id: string; glyph: string; palette: BookPalette; isbn?: string },
): Book {
  const info = volume.volumeInfo;
  return {
    id: overrides.id,
    googleId: volume.id,
    isbn: overrides.isbn,
    title: info.title,
    author: info.authors?.[0] ?? "Autor desconhecido",
    pages: info.pageCount ?? 0,
    glyph: overrides.glyph,
    palette: overrides.palette,
    coverUrl: coverUrl(volume),
    description: info.description,
    rating:
      info.averageRating != null
        ? { average: info.averageRating, count: info.ratingsCount ?? 0 }
        : undefined,
  };
}
