import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewerId } from "@/lib/session";

export async function GET() {
  const userId = await getViewerId();
  if (!userId)
    return NextResponse.json({ error: "Entre na sua conta." }, { status: 401 });

  const book = {
    select: { id: true, title: true, authors: true, isbn13: true },
  };
  const [
    user,
    shelf,
    readings,
    sessions,
    reviews,
    reviewLikes,
    comments,
    lists,
    follows,
  ] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        handle: true,
        bio: true,
        city: true,
        createdAt: true,
      },
    }),
    db.userBook.findMany({
      where: { userId },
      select: {
        status: true,
        statusChangedAt: true,
        liked: true,
        favoritePosition: true,
        currentPage: true,
        note: true,
        abandonReason: true,
        wantsToReturn: true,
        book,
      },
    }),
    db.reading.findMany({
      where: { userId },
      orderBy: [{ bookId: "asc" }, { number: "asc" }],
      select: {
        number: true,
        status: true,
        startedAt: true,
        startPrecision: true,
        endedAt: true,
        endPrecision: true,
        endPage: true,
        book,
      },
    }),
    db.readingSession.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      select: {
        date: true,
        pages: true,
        minutes: true,
        pageEnd: true,
        note: true,
        book,
      },
    }),
    db.review.findMany({
      where: { userId },
      select: { rating: true, text: true, createdAt: true, book },
    }),
    db.reviewLike.findMany({
      where: { userId },
      select: { review: { select: { id: true, book } } },
    }),
    db.reviewComment.findMany({
      where: { userId },
      select: { text: true, createdAt: true, reviewId: true },
    }),
    db.list.findMany({
      where: { ownerId: userId },
      select: {
        title: true,
        visibility: true,
        createdAt: true,
        items: { select: { createdAt: true, book } },
      },
    }),
    db.listFollow.findMany({
      where: { userId },
      select: { list: { select: { id: true, title: true } } },
    }),
  ]);

  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      user,
      shelf,
      readings,
      sessions,
      reviews,
      likedReviews: reviewLikes.map((l) => l.review),
      comments,
      lists,
      followedLists: follows.map((f) => f.list),
    },
    null,
    2,
  );
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="trapiche-${user.handle}.json"`,
    },
  });
}
