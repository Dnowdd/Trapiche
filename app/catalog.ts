import { searchBooks, volumeToBook } from "@/lib/google-books"
import type { Book, BookPalette, GoogleBooksVolume } from "@/lib/types/book"

const PALETTES: BookPalette[] = [
  { bg: "#2A2920", fg: "#FFF8D5", pub: "Companhia das Letras" },
  { bg: "#5B3A1E", fg: "#F8E99D", pub: "Record" },
  { bg: "#1E3A3A", fg: "#FFE767", pub: "Cosac Naify" },
  { bg: "#7A2F1F", fg: "#FFE767", pub: "Editora 34" },
  { bg: "#0F2A4A", fg: "#FFF8D5", pub: "Penguin Brasil" },
  { bg: "#FFE767", fg: "#343600", pub: "Trapiche Indie" },
  { bg: "#F8E99D", fg: "#433E12", pub: "Iluminuras" },
  { bg: "#2E2A1E", fg: "#FFE767", pub: "Nova Fronteira" },
  { bg: "#4F4030", fg: "#FFF8D5", pub: "Objetiva" },
  { bg: "#8A4B22", fg: "#FFF8D5", pub: "Alfaguara" },
  { bg: "#1F4030", fg: "#F8E99D", pub: "Boitempo" },
  { bg: "#3A1F40", fg: "#FFE767", pub: "Mundaréu" },
  { bg: "#FFF8D5", fg: "#433E12", pub: "Editora 34" },
  { bg: "#552020", fg: "#FFE767", pub: "Quadrante" },
]

const GLYPHS = ["♁", "✶", "★", "≈", "✦", "○", "▲", "◇", "✿", "▼", "◐", "❀"]

function hashIndex(str: string, len: number): number {
  let h = 0
  for (const c of str) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0
  return Math.abs(h) % len
}

function assignVisuals(vol: GoogleBooksVolume): Book {
  return volumeToBook(vol, {
    id: vol.id,
    glyph: GLYPHS[hashIndex(vol.id, GLYPHS.length)],
    palette: PALETTES[hashIndex(vol.id, PALETTES.length)],
  })
}

export async function getFeaturedBooks(maxResults = 24): Promise<Book[]> {
  try {
    const volumes = await searchBooks(
      "literatura brasileira ficção romance",
      maxResults,
    )
    return volumes.map(assignVisuals)
  } catch {
    return []
  }
}

// ---------- Editorial content (homepage sections) ----------

interface ListDef {
  title: string
  count: number
  kind: "Pública" | "Privada" | "Compartilhada"
  by: string
  byInitials: string
  query: string
}

const LIST_DEFS: ListDef[] = [
  {
    title: "Brasileiras que mudam o ano",
    count: 12,
    kind: "Pública",
    by: "Você",
    byInitials: "FC",
    query: "ficção brasileira mulheres autoras",
  },
  {
    title: "Modernismo de cabeça",
    count: 8,
    kind: "Compartilhada",
    by: "Júlia M.",
    byInitials: "JM",
    query: "modernismo brasileiro romance",
  },
  {
    title: "Para ler no inverno",
    count: 6,
    kind: "Privada",
    by: "Você",
    byInitials: "FC",
    query: "nordeste brasileiro literatura contos",
  },
]

const REVIEW_LOREM = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt.",
]

const REVIEW_META = [
  { user: "Maria Eduarda", handle: "@duda.le", initials: "ME", stars: 5, date: "12 mai" },
  { user: "Pedro Antunes", handle: "@pdrntns", initials: "PA", stars: 4, date: "08 mai" },
  { user: "Luana Vidal", handle: "@luvidal", initials: "LV", stars: 5, date: "05 mai" },
]

export async function getLists() {
  const results = await Promise.all(
    LIST_DEFS.map((def) => searchBooks(def.query, 3).catch(() => [] as GoogleBooksVolume[])),
  )
  return LIST_DEFS.map((def, i) => ({
    title: def.title,
    count: def.count,
    kind: def.kind,
    by: def.by,
    byInitials: def.byInitials,
    books: results[i].map(assignVisuals),
  }))
}

export async function getReviews() {
  try {
    const volumes = await searchBooks("literatura brasileira", 3)
    return volumes.slice(0, 3).map((vol, i) => ({
      book: assignVisuals(vol),
      ...REVIEW_META[i],
      text: REVIEW_LOREM[i],
    }))
  } catch {
    return []
  }
}
