import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getViewerId } from "@/lib/session";
import { privacySelect } from "@/lib/privacy";

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
    memberships,
    goals,
    notifications,
    reports,
    tickets,
    avatar,
    apiKeys,
    quotes,
    tags,
    imports,
    accounts,
    authSessions,
    loans,
    challenges,
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
        developerSince: true,
        emailVerified: true,
        inactivityReminder: true,
        monthlyDigest: true,
        ...privacySelect,
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
      select: {
        rating: true,
        text: true,
        spoiler: true,
        createdAt: true,
        book,
      },
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
    db.listMember.findMany({
      where: { userId, list: { ownerId: { not: userId } } },
      select: {
        role: true,
        pinned: true,
        list: { select: { id: true, title: true } },
      },
    }),
    db.readingGoal.findMany({
      where: { userId },
      orderBy: { year: "asc" },
      select: { year: true, target: true, createdAt: true, updatedAt: true },
    }),
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        kind: true,
        createdAt: true,
        readAt: true,
        actor: { select: { handle: true } },
      },
    }),
    db.report.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: "asc" },
      select: {
        reason: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        reviewId: true,
        commentId: true,
        quoteId: true,
      },
    }),
    db.supportTicket.findMany({
      where: { userId },
      orderBy: { number: "asc" },
      select: {
        number: true,
        subject: true,
        category: true,
        status: true,
        createdAt: true,
        closedAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            body: true,
            staff: true,
            createdAt: true,
            attachments: {
              select: {
                mimeType: true,
                width: true,
                height: true,
                data: true,
              },
            },
          },
        },
      },
    }),
    db.userAvatar.findUnique({
      where: { userId },
      select: { mimeType: true, data: true, updatedAt: true },
    }),
    db.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        name: true,
        prefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    }),
    db.quote.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        text: true,
        page: true,
        note: true,
        private: true,
        createdAt: true,
        book,
      },
    }),
    db.tag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: {
        name: true,
        color: true,
        private: true,
        createdAt: true,
        books: { select: { userBook: { select: { book } } } },
      },
    }),
    db.importJob.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        source: true,
        fileName: true,
        status: true,
        total: true,
        createdAt: true,
        finishedAt: true,
        rows: {
          orderBy: { index: "asc" },
          select: {
            title: true,
            author: true,
            isbn: true,
            shelf: true,
            rating: true,
            review: true,
            dateRead: true,
            tags: true,
            status: true,
            bookId: true,
          },
        },
      },
    }),
    db.account.findMany({
      where: { userId },
      select: { providerId: true, createdAt: true },
    }),
    db.session.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
      },
    }),
    db.loan.findMany({
      where: { userId },
      orderBy: { lentAt: "asc" },
      select: {
        person: true,
        lentAt: true,
        dueAt: true,
        returnedAt: true,
        note: true,
        book,
      },
    }),
    db.challenge.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        title: true,
        kind: true,
        value: true,
        target: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
      },
    }),
  ]);

  const dataUri = (mimeType: string, data: Uint8Array) =>
    `data:${mimeType};base64,${Buffer.from(data).toString("base64")}`;

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
      sharedLists: memberships,
      readingGoals: goals,
      notifications: notifications.map((n) => ({
        kind: n.kind,
        from: n.actor.handle,
        createdAt: n.createdAt,
        readAt: n.readAt,
      })),
      reports,
      supportTickets: tickets.map((t) => ({
        ...t,
        messages: t.messages.map((m) => ({
          body: m.body,
          from: m.staff ? "support" : "you",
          createdAt: m.createdAt,
          attachments: m.attachments.map((a) => ({
            width: a.width,
            height: a.height,
            image: dataUri(a.mimeType, a.data),
          })),
        })),
      })),
      apiKeys,
      quotes,
      tags: tags.map((t) => ({
        name: t.name,
        color: t.color,
        private: t.private,
        createdAt: t.createdAt,
        books: t.books.map((b) => b.userBook.book),
      })),
      imports,
      loginMethods: accounts.map((a) => ({
        provider: a.providerId === "credential" ? "email" : a.providerId,
        linkedAt: a.createdAt,
      })),
      loginSessions: authSessions,
      loans,
      challenges,
      avatar: avatar
        ? {
            updatedAt: avatar.updatedAt,
            image: dataUri(avatar.mimeType, avatar.data),
          }
        : null,
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
