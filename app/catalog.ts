import { getBookByIsbn, getBookByQuery, volumeToBook } from "@/lib/google-books"
import type { Book, BookPalette } from "@/lib/types/book"

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

interface CatalogEntry {
  id: string
  title: string
  author: string
  glyph: string
  paletteIndex: number
  isbn?: string
}

const CATALOG: CatalogEntry[] = [
  { id: "capitaes", title: "Capitães da Areia", author: "Jorge Amado", glyph: "♁", paletteIndex: 0, isbn: "9788535914145" },
  { id: "memorias", title: "Memórias Póstumas de Brás Cubas", author: "Machado de Assis", glyph: "✶", paletteIndex: 1 },
  { id: "hora", title: "A Hora da Estrela", author: "Clarice Lispector", glyph: "★", paletteIndex: 2 },
  { id: "secas", title: "Vidas Secas", author: "Graciliano Ramos", glyph: "≈", paletteIndex: 3 },
  { id: "sertao", title: "Grande Sertão: Veredas", author: "Guimarães Rosa", glyph: "✦", paletteIndex: 4 },
  { id: "casmurro", title: "Dom Casmurro", author: "Machado de Assis", glyph: "✶", paletteIndex: 5 },
  { id: "quinze", title: "O Quinze", author: "Rachel de Queiroz", glyph: "○", paletteIndex: 6 },
  { id: "macunaima", title: "Macunaíma", author: "Mário de Andrade", glyph: "▲", paletteIndex: 7 },
  { id: "paixao", title: "A Paixão Segundo G.H.", author: "Clarice Lispector", glyph: "★", paletteIndex: 8 },
  { id: "iracema", title: "Iracema", author: "José de Alencar", glyph: "❀", paletteIndex: 9 },
  { id: "sagarana", title: "Sagarana", author: "Guimarães Rosa", glyph: "✦", paletteIndex: 10 },
  { id: "quarto", title: "Quarto de Despejo", author: "Carolina Maria de Jesus", glyph: "◇", paletteIndex: 11 },
  { id: "sertoes", title: "Os Sertões", author: "Euclides da Cunha", glyph: "▼", paletteIndex: 12 },
  { id: "cortico", title: "O Cortiço", author: "Aluísio Azevedo", glyph: "◐", paletteIndex: 13 },
  { id: "poncia", title: "Ponciá Vicêncio", author: "Conceição Evaristo", glyph: "✿", paletteIndex: 0 },
  { id: "torto", title: "Torto Arado", author: "Itamar Vieira Junior", glyph: "✶", paletteIndex: 1 },
]

async function enrichEntry(entry: CatalogEntry): Promise<Book> {
  const palette = PALETTES[entry.paletteIndex]
  const overrides = { id: entry.id, glyph: entry.glyph, palette, isbn: entry.isbn }

  try {
    const volume = entry.isbn
      ? await getBookByIsbn(entry.isbn)
      : await getBookByQuery(entry.title, entry.author)

    if (volume) return volumeToBook(volume, overrides)
  } catch {
    // API unavailable — fall through to static fallback
  }

  return {
    id: entry.id,
    isbn: entry.isbn,
    title: entry.title,
    author: entry.author,
    pages: 0,
    glyph: entry.glyph,
    palette,
  }
}

export async function getBooks(ids?: string[]): Promise<Book[]> {
  const entries = ids
    ? CATALOG.filter((e) => ids.includes(e.id))
    : CATALOG
  return Promise.all(entries.map(enrichEntry))
}

export async function getBook(id: string): Promise<Book | null> {
  const entry = CATALOG.find((e) => e.id === id)
  if (!entry) return null
  return enrichEntry(entry)
}

// ---------- Editorial content (listas e reviews da landing page) ----------

interface ListDef {
  title: string
  count: number
  kind: "Pública" | "Privada" | "Compartilhada"
  by: string
  byInitials: string
  bookIds: string[]
}

interface ReviewDef {
  bookId: string
  user: string
  handle: string
  initials: string
  stars: number
  date: string
  text: string
}

const LIST_DEFS: ListDef[] = [
  {
    title: "Brasileiras que mudam o ano",
    count: 12,
    kind: "Pública",
    by: "Você",
    byInitials: "FC",
    bookIds: ["poncia", "hora", "torto"],
  },
  {
    title: "Modernismo de cabeça",
    count: 8,
    kind: "Compartilhada",
    by: "Júlia M.",
    byInitials: "JM",
    bookIds: ["macunaima", "sertao", "sagarana"],
  },
  {
    title: "Para ler no inverno",
    count: 6,
    kind: "Privada",
    by: "Você",
    byInitials: "FC",
    bookIds: ["secas", "quinze", "cortico"],
  },
]

const REVIEW_DEFS: ReviewDef[] = [
  {
    bookId: "torto",
    user: "Maria Eduarda",
    handle: "@duda.le",
    initials: "ME",
    stars: 5,
    date: "12 mai",
    text: "Um livro que me atravessou. Itamar escreve com a paciência de quem entende que o tempo do sertão é outro. Bibiana e Belonísia ficaram comigo dias depois de fechar o livro.",
  },
  {
    bookId: "hora",
    user: "Pedro Antunes",
    handle: "@pdrntns",
    initials: "PA",
    stars: 4,
    date: "08 mai",
    text: "Clarice no estado mais puro. Macabéa é uma personagem que dói. Tirei uma estrela só porque eu sou implicante com finais que parecem brincar com o leitor — mas esse é proposital, eu sei.",
  },
  {
    bookId: "quarto",
    user: "Luana Vidal",
    handle: "@luvidal",
    initials: "LV",
    stars: 5,
    date: "05 mai",
    text: "Carolina escreveu o que o Brasil tenta esquecer. Cada página é um soco no estômago e ao mesmo tempo uma demonstração de poesia. Leitura obrigatória, do tipo que muda como você vê a rua de casa.",
  },
]

export async function getLists() {
  const allIds = LIST_DEFS.flatMap((l) => l.bookIds)
  const uniqueIds = [...new Set(allIds)]
  const books = await getBooks(uniqueIds)
  const bookMap = Object.fromEntries(books.map((b) => [b.id, b]))

  return LIST_DEFS.map((def) => ({
    title: def.title,
    count: def.count,
    kind: def.kind,
    by: def.by,
    byInitials: def.byInitials,
    books: def.bookIds.map((id) => bookMap[id]).filter(Boolean) as Book[],
  }))
}

export async function getReviews() {
  const ids = REVIEW_DEFS.map((r) => r.bookId)
  const books = await getBooks(ids)
  const bookMap = Object.fromEntries(books.map((b) => [b.id, b]))

  return REVIEW_DEFS.map((def) => ({
    ...def,
    book: bookMap[def.bookId],
  })).filter((r) => r.book != null)
}

export { CATALOG }
