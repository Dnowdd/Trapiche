import { NextRequest, NextResponse } from "next/server"
import { catalogMeta, getCatalog, searchCatalog } from "@/app/catalog"
import type { CatalogBook } from "@/lib/types/book"

/**
 * Catálogo mockado da home — servido de lib/data/books.json.
 *
 *   GET /api/books                → tudo
 *   GET /api/books?limit=8        → os 8 primeiros
 *   GET /api/books?author=clarice → filtra por autor
 *   GET /api/books?q=sertao       → busca por título ou autor
 *   GET /api/books?withCover=1    → só os que têm capa
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const q = params.get("q")
  const author = params.get("author")
  const limit = Number(params.get("limit") ?? "0")
  const withCover = params.get("withCover") === "1"

  let books: CatalogBook[] = q ? searchCatalog(q, 500) : getCatalog()

  if (author) {
    const needle = author
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
    books = books.filter((b) =>
      b.author
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(needle),
    )
  }

  if (withCover) books = books.filter((b) => Boolean(b.coverUrl))
  if (limit > 0) books = books.slice(0, limit)

  return NextResponse.json({
    generatedAt: catalogMeta.generatedAt,
    total: books.length,
    books,
  })
}
