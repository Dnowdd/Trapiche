import { NextRequest, NextResponse } from "next/server"
import { searchBooks } from "@/lib/google-books"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")
  const maxResults = Number(req.nextUrl.searchParams.get("max") ?? "10")

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Query muito curta" }, { status: 400 })
  }

  try {
    const volumes = await searchBooks(q, Math.min(maxResults, 40))
    return NextResponse.json({ items: volumes })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
