import catalogData from "@/lib/data/books.json";
import type { Book, CatalogBook } from "@/lib/types/book";

/**
 * Catálogo local de destaques da home (hero, login e reserva dos populares).
 *
 * Os dados vêm de lib/data/books.json, gerado por `npm run books`
 * (scripts/build-books.mjs) a partir da lista em scripts/data/book-list.mjs.
 * Para adicionar livros: edite a lista e rode o script de novo — ele só busca
 * na API do Google o que ainda não estiver em cache.
 */
const CATALOG = (catalogData.books ?? []) as unknown as CatalogBook[];

export const catalogMeta = {
  generatedAt: catalogData.generatedAt,
  total: catalogData.total,
};

function norm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Um livro por autor, em rodízio — evita 14 Machados seguidos na home. */
function spreadByAuthor(books: CatalogBook[]): CatalogBook[] {
  const groups = new Map<string, CatalogBook[]>();
  for (const book of books) {
    const key = norm(book.author);
    const group = groups.get(key);
    if (group) group.push(book);
    else groups.set(key, [book]);
  }

  const buckets = [...groups.values()];
  const out: CatalogBook[] = [];
  for (let round = 0; out.length < books.length; round++) {
    let added = false;
    for (const bucket of buckets) {
      const book = bucket[round];
      if (book) {
        out.push(book);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

const WITH_COVER = CATALOG.filter((b) => Boolean(b.coverUrl));
const FEATURED = spreadByAuthor(WITH_COVER);

// ---------- acesso ao catálogo ----------

export function getCatalog(): CatalogBook[] {
  return CATALOG;
}

export function getBookById(id: string): CatalogBook | undefined {
  return CATALOG.find((b) => b.id === id || b.slug === id);
}

export function getBooksByAuthor(author: string, limit = 12): CatalogBook[] {
  const needle = norm(author);
  return CATALOG.filter((b) => norm(b.author).includes(needle)).slice(0, limit);
}

export function getAuthors(): string[] {
  return [...new Set(CATALOG.map((b) => b.author))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

export function searchCatalog(query: string, limit = 10): CatalogBook[] {
  const needle = norm(query);
  if (needle.length < 2) return [];
  return CATALOG.filter(
    (b) => norm(b.title).includes(needle) || norm(b.author).includes(needle),
  ).slice(0, limit);
}

/** Destaques da home — variados por autor, sempre com capa. */
export async function getFeaturedBooks(maxResults = 24): Promise<Book[]> {
  return FEATURED.slice(0, maxResults);
}
