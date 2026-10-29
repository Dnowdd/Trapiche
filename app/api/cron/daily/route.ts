import { NextRequest, NextResponse } from "next/server";
import { ensureBook, loadBook } from "@/lib/books";
import { db } from "@/lib/db";
import { isOpenLibraryId } from "@/lib/open-library";
import { byAuthor, editionsOf, relatedBooks } from "@/lib/queries/book";
import { getHomePopular } from "@/lib/queries/home";

export const maxDuration = 300;

const GOOGLE_REFRESH_BATCH = 100;
const WARM_BOOKS = 20;

async function inBatches<T>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<unknown>,
) {
  for (let i = 0; i < items.length; i += size)
    await Promise.allSettled(items.slice(i, i + size).map(fn));
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dayAgo = new Date(Date.now() - 86_400_000);
  const stale = await db.book.findMany({
    where: {
      syncedAt: { lt: dayAgo },
      NOT: { AND: [{ id: { startsWith: "OL" } }, { id: { endsWith: "M" } }] },
    },
    orderBy: { syncedAt: "asc" },
    select: { id: true },
    take: GOOGLE_REFRESH_BATCH,
  });
  const google = stale.map((b) => b.id).filter((id) => !isOpenLibraryId(id));
  await inBatches(google, 5, (id) => ensureBook(id));

  const popular = (await getHomePopular(WARM_BOOKS)).map((p) => p.book.id);
  await inBatches(popular, 3, async (id) => {
    const book = await loadBook(id);
    if (!book) return;
    const author = book.authors[0] ?? null;
    await Promise.allSettled([
      editionsOf(book),
      byAuthor(book.id, book.title, author),
      relatedBooks(book.id, book.categories, author),
    ]);
  });

  return NextResponse.json({
    refreshed: google.length,
    warmed: popular.length,
  });
}
