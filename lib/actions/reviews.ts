"use server";

import { refresh } from "next/cache";
import { db } from "../db";
import { ensureBook } from "../books";
import { editionIds } from "../works";
import { notify, unnotify } from "../notifications";
import { fail, withUser } from "./result";
import { getViewerId } from "../session";
import { fmtAgo } from "../dates";
import { initialsOf } from "../queries/book";

export async function saveReview(
  bookId: string,
  input: { rating: number; text?: string; spoiler?: boolean },
) {
  return withUser(async (userId) => {
    const rating = Number(input.rating);
    if (!Number.isInteger(rating * 2) || rating < 0.5 || rating > 5)
      fail("Escolha uma nota de meia a 5 estrelas.");
    const text = typeof input.text === "string" ? input.text.trim() : "";
    if (text.length > 5000)
      fail("A resenha pode ter no máximo 5.000 caracteres.");

    const spoiler = Boolean(text && input.spoiler);

    await ensureBook(bookId);
    const ids = await editionIds(bookId);
    await db.$transaction(async (tx) => {
      const existing =
        (await tx.review.findUnique({
          where: { userId_bookId: { userId, bookId } },
        })) ??
        (await tx.review.findFirst({
          where: { userId, bookId: { in: ids } },
          orderBy: { updatedAt: "desc" },
        }));
      const review = existing
        ? await tx.review.update({
            where: { id: existing.id },
            data: { rating, text: text || null, spoiler },
          })
        : await tx.review.create({
            data: { userId, bookId, rating, text: text || null, spoiler },
          });
      const snippet = text ? text.slice(0, 280) : null;
      if (existing) {
        await tx.activity.updateMany({
          where: { reviewId: review.id },
          data: { rating, text: snippet },
        });
      } else {
        await tx.activity.create({
          data: {
            userId,
            bookId,
            reviewId: review.id,
            kind: "REVIEW",
            rating,
            text: snippet,
          },
        });
      }
    });
    refresh();
  });
}

export async function deleteReview(bookId: string) {
  return withUser(async (userId) => {
    const ids = await editionIds(bookId);
    await db.review.deleteMany({ where: { userId, bookId: { in: ids } } });
    refresh();
  });
}

export async function toggleReviewLike(reviewId: string) {
  return withUser(async (userId) => {
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { userId: true },
    });
    if (!review) fail("Essa resenha não existe mais.");
    if (review.userId === userId)
      fail("Você não pode curtir a própria resenha.");
    const key = { userId_reviewId: { userId, reviewId } };
    const liked = await db.reviewLike.findUnique({ where: key });
    const notice = {
      userId: review.userId,
      actorId: userId,
      kind: "REVIEW_LIKED" as const,
      reviewId,
    };
    if (liked) {
      await db.reviewLike.delete({ where: key });
      await unnotify(notice);
    } else {
      await db.reviewLike.create({ data: { userId, reviewId } });
      await notify(notice);
    }
    refresh();
    return { liked: !liked };
  });
}

export async function addReviewComment(reviewId: string, text: string) {
  return withUser(async (userId) => {
    const value = typeof text === "string" ? text.trim() : "";
    if (!value) fail("Escreva um comentário.");
    if (value.length > 1000)
      fail("O comentário pode ter no máximo 1.000 caracteres.");
    const review = await db.review.findUnique({ where: { id: reviewId } });
    if (!review) fail("Essa resenha não existe mais.");
    const comment = await db.reviewComment.create({
      data: { reviewId, userId, text: value },
    });
    await notify({
      userId: review.userId,
      actorId: userId,
      kind: "REVIEW_COMMENTED",
      reviewId,
      commentId: comment.id,
    });
    refresh();
  });
}

export async function deleteReviewComment(commentId: string) {
  return withUser(async (userId) => {
    const comment = await db.reviewComment.findUnique({
      where: { id: commentId },
      include: { review: { select: { userId: true } } },
    });
    if (!comment) return;
    if (comment.userId !== userId && comment.review.userId !== userId)
      fail("Você não pode apagar esse comentário.");
    await db.reviewComment.delete({ where: { id: commentId } });
    refresh();
  });
}

export async function getReviewComments(reviewId: string) {
  const viewerId = await getViewerId();
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { userId: true },
  });
  if (!review) return [];
  const rows = await db.reviewComment.findMany({
    where: { reviewId, hiddenAt: null },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { user: { select: { name: true, handle: true } } },
  });
  return rows.map((c) => ({
    id: c.id,
    text: c.text,
    user: c.user.name,
    handle: c.user.handle,
    initials: initialsOf(c.user.name),
    date: fmtAgo(c.createdAt),
    canDelete: viewerId === c.userId || viewerId === review.userId,
    mine: viewerId === c.userId,
  }));
}
