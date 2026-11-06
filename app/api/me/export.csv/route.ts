import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewerId } from "@/lib/session";
import { toGoodreadsCsv } from "@/lib/import/export";

export async function GET() {
  const userId = await getViewerId();
  if (!userId)
    return NextResponse.json({ error: "Entre na sua conta." }, { status: 401 });

  const [user, shelf, readings, reviews] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { handle: true },
    }),
    db.userBook.findMany({
      where: { userId, status: { not: null } },
      orderBy: { createdAt: "asc" },
      select: {
        bookId: true,
        status: true,
        createdAt: true,
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            isbn10: true,
            isbn13: true,
            publisher: true,
            publishedDate: true,
            pageCount: true,
          },
        },
        tags: { select: { tag: { select: { name: true } } } },
      },
    }),
    db.reading.findMany({
      where: { userId, status: "FINISHED" },
      select: { bookId: true, endedAt: true },
    }),
    db.review.findMany({
      where: { userId },
      select: { bookId: true, rating: true, text: true, spoiler: true },
    }),
  ]);

  const csv = toGoodreadsCsv(
    shelf.map((s) => {
      const done = readings.filter((r) => r.bookId === s.bookId);
      const review = reviews.find((r) => r.bookId === s.bookId);
      return {
        id: s.book.id,
        title: s.book.title,
        authors: s.book.authors,
        isbn10: s.book.isbn10,
        isbn13: s.book.isbn13,
        publisher: s.book.publisher,
        publishedDate: s.book.publishedDate,
        pageCount: s.book.pageCount,
        status: s.status!,
        addedAt: s.createdAt,
        readAt:
          done
            .map((r) => r.endedAt)
            .filter((d): d is Date => d != null)
            .sort((a, b) => b.getTime() - a.getTime())[0] ?? null,
        readCount: done.length,
        rating: review?.rating ?? null,
        review: review?.text ?? null,
        spoiler: review?.spoiler ?? false,
        tags: s.tags.map((t) => t.tag.name),
      };
    }),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trapiche-${user.handle}-goodreads.csv"`,
    },
  });
}
