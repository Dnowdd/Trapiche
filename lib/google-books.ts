import type { Book, BookPalette, GoogleBooksResponse, GoogleBooksVolume } from "./types/book"

const API_BASE = "https://www.googleapis.com/books/v1"

function getKey() {
  const key = process.env.GOOGLE_BOOKS_API_KEY
  if (!key) throw new Error("GOOGLE_BOOKS_API_KEY not set")
  return key
}

function coverUrl(volume: GoogleBooksVolume): string | undefined {
  const links = volume.volumeInfo.imageLinks
  if (!links) return undefined
  // Google Books returns HTTP — upgrade to HTTPS and request higher res
  const url = links.medium ?? links.small ?? links.thumbnail ?? links.smallThumbnail
  return url?.replace("http:", "https:").replace("&zoom=1", "&zoom=3")
}

async function fetchVolumes(query: string, maxResults = 10): Promise<GoogleBooksVolume[]> {
  const key = getKey()
  const url = `${API_BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${key}`
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) throw new Error(`Google Books API ${res.status}: ${res.statusText}`)
  const data: GoogleBooksResponse = await res.json()
  return data.items ?? []
}

export async function searchBooks(query: string, maxResults = 10): Promise<GoogleBooksVolume[]> {
  return fetchVolumes(query, maxResults)
}

export async function getBookByIsbn(isbn: string): Promise<GoogleBooksVolume | null> {
  const items = await fetchVolumes(`isbn:${isbn}`, 1)
  return items[0] ?? null
}

export async function getBookByQuery(title: string, author: string): Promise<GoogleBooksVolume | null> {
  const items = await fetchVolumes(`intitle:${title}+inauthor:${author}`, 1)
  return items[0] ?? null
}

export async function getVolume(volumeId: string): Promise<GoogleBooksVolume> {
  const key = getKey()
  const res = await fetch(`${API_BASE}/volumes/${volumeId}?key=${key}`, {
    next: { revalidate: 86400 },
  })
  if (!res.ok) throw new Error(`Google Books API ${res.status}: ${res.statusText}`)
  return res.json()
}

export function volumeToBook(
  volume: GoogleBooksVolume,
  overrides: { id: string; glyph: string; palette: BookPalette; isbn?: string }
): Book {
  const info = volume.volumeInfo
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
  }
}
