import catalogData from "@/lib/data/books.json";
import type { Book, CatalogBook } from "@/lib/types/book";

/**
 * Catálogo local — mock da home page.
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

// ---------- conteúdo editorial (seções da home) ----------

interface ListDef {
  title: string;
  kind: "Pública" | "Privada" | "Compartilhada";
  by: string;
  byInitials: string;
  authors: string[];
}

const LIST_DEFS: ListDef[] = [
  {
    title: "Brasileiras que mudam o ano",
    kind: "Pública",
    by: "Você",
    byInitials: "FC",
    authors: [
      "Clarice Lispector",
      "Conceição Evaristo",
      "Lygia Fagundes Telles",
      "Carolina Maria de Jesus",
      "Rachel de Queiroz",
      "Cecília Meireles",
      "Nélida Piñon",
      "Ana Maria Gonçalves",
      "Cora Coralina",
    ],
  },
  {
    title: "Modernismo de cabeça",
    kind: "Compartilhada",
    by: "Júlia M.",
    byInitials: "JM",
    authors: [
      "Mário de Andrade",
      "Oswald de Andrade",
      "Manuel Bandeira",
      "Carlos Drummond de Andrade",
      "Cecília Meireles",
    ],
  },
  {
    title: "Para ler no inverno",
    kind: "Privada",
    by: "Você",
    byInitials: "FC",
    authors: [
      "Graciliano Ramos",
      "José Lins do Rego",
      "Ariano Suassuna",
      "João Cabral de Melo Neto",
      "Euclides da Cunha",
      "Raduan Nassar",
    ],
  },
];

function booksForAuthors(authors: string[]): CatalogBook[] {
  const wanted = authors.map(norm);
  return WITH_COVER.filter((b) =>
    wanted.some((a) => norm(b.author).includes(a)),
  );
}

export async function getLists() {
  return LIST_DEFS.map((def) => {
    const books = spreadByAuthor(booksForAuthors(def.authors));
    return {
      title: def.title,
      count: books.length,
      kind: def.kind,
      by: def.by,
      byInitials: def.byInitials,
      books: books.slice(0, 3),
    };
  });
}

const REVIEW_LOREM = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt.",
];

const REVIEW_META = [
  {
    user: "Maria Eduarda",
    handle: "@duda.le",
    initials: "ME",
    stars: 5,
    date: "12 mai",
  },
  {
    user: "Pedro Antunes",
    handle: "@pdrntns",
    initials: "PA",
    stars: 4,
    date: "08 mai",
  },
  {
    user: "Luana Vidal",
    handle: "@luvidal",
    initials: "LV",
    stars: 5,
    date: "05 mai",
  },
];

const REVIEW_PICKS = ["Torto Arado", "A Hora da Estrela", "Grande Sertão"];

export async function getReviews() {
  const picked = REVIEW_PICKS.map((title) => {
    const needle = norm(title);
    return WITH_COVER.find((b) => norm(b.title).includes(needle));
  });

  const books = picked.map((book, i) => book ?? FEATURED[i]);

  return books
    .filter((b): b is CatalogBook => Boolean(b))
    .map((book, i) => ({
      book,
      ...REVIEW_META[i],
      text: REVIEW_LOREM[i],
    }));
}
