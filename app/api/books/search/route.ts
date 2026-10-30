import { NextRequest, NextResponse } from "next/server";
import { sharpCover } from "@/lib/cover-url";
import { smartSearch } from "@/lib/google-books";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import type { GoogleBooksVolume, SearchResult } from "@/lib/types/book";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const maxResults = Number(req.nextUrl.searchParams.get("max") ?? "10");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Query muito curta" }, { status: 400 });
  }
  if (await rateLimited(`search:${clientIp(req.headers)}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Muitas buscas seguidas. Espere um pouco." },
      { status: 429 },
    );
  }

  try {
    const { works, authors, google } = await smartSearch(
      q,
      Math.min(maxResults, 40),
    );
    const toResult = (
      main: GoogleBooksVolume,
      editions: number,
    ): SearchResult => {
      const info = main.volumeInfo;
      const thumb = info.imageLinks?.thumbnail;
      return {
        id: main.id,
        title: info.title,
        authors: info.authors ?? [],
        year: info.publishedDate?.slice(0, 4) ?? null,
        publisher: info.publisher ?? null,
        coverUrl: thumb ? sharpCover(thumb, 2) : null,
        editions,
      };
    };
    return NextResponse.json({
      items: works.map((w) => toResult(w.main, w.editions.length)),
      authors,
      google: google.map((v) => toResult(v, 1)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
