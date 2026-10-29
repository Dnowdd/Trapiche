import { NextRequest, NextResponse } from "next/server";
import { sharpCover } from "@/lib/cover-url";
import { smartSearch } from "@/lib/google-books";
import type { SearchResult } from "@/lib/types/book";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const maxResults = Number(req.nextUrl.searchParams.get("max") ?? "10");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Query muito curta" }, { status: 400 });
  }

  try {
    const works = await smartSearch(q, Math.min(maxResults, 40));
    const items: SearchResult[] = works.map(({ main, editions }) => {
      const info = main.volumeInfo;
      const thumb = info.imageLinks?.thumbnail;
      return {
        id: main.id,
        title: info.title,
        authors: info.authors ?? [],
        year: info.publishedDate?.slice(0, 4) ?? null,
        publisher: info.publisher ?? null,
        coverUrl: thumb ? sharpCover(thumb, 2) : null,
        editions: editions.length,
      };
    });
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
