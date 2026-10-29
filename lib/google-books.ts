import type {
  Book,
  BookPalette,
  GoogleBooksResponse,
  GoogleBooksVolume,
} from "./types/book";
import { sharpCover } from "./cover-url";
import {
  authorSurname,
  groupWorks,
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

async function fetchWithRetry(url: string) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (res.ok || attempt >= 2 || (res.status < 500 && res.status !== 429))
      return res;
    await new Promise((r) => setTimeout(r, 400 * 3 ** attempt));
  }
}

async function fetchVolumes(
  query: string,
  maxResults = 10,
  orderBy: "relevance" | "newest" = "relevance",
  lang?: string,
): Promise<GoogleBooksVolume[]> {
  const key = getKey();
  const langParam = lang ? `&langRestrict=${encodeURIComponent(lang)}` : "";
  const url = `${API_BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&orderBy=${orderBy}&printType=books${langParam}&key=${key}`;
  const res = await fetchWithRetry(url);
  if (!res.ok)
    throw new Error(`Google Books API ${res.status}: ${res.statusText}`);
  const data: GoogleBooksResponse = await res.json();
  return (data.items ?? []).filter((v) => v.volumeInfo?.title);
}

export async function searchBooks(
  query: string,
  maxResults = 10,
  lang?: string,
): Promise<GoogleBooksVolume[]> {
  return fetchVolumes(query, maxResults, "relevance", lang);
}

export async function smartSearch(
  query: string,
  maxResults = 10,
): Promise<Work[]> {
  const q = query.trim();
  const [byTitle, general] = await Promise.all([
    fetchVolumes(`intitle:${q}`, 40).catch(() => [] as GoogleBooksVolume[]),
    fetchVolumes(q, 40).catch(() => [] as GoogleBooksVolume[]),
  ]);
  return groupWorks([...byTitle, ...general], q).slice(0, maxResults);
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
  const res = await fetchWithRetry(
    `${API_BASE}/volumes/${encodeURIComponent(volumeId)}?key=${key}`,
  );
  if (!res.ok)
    throw new Error(`Google Books API ${res.status}: ${res.statusText}`);
  return res.json();
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
