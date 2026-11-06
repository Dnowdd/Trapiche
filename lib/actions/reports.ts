"use server";

import { revalidate } from "../revalidate";
import { db } from "../db";
import { fail, throttle, withUser } from "./result";
import { REPORT_REASONS, type ReportReason } from "../report-reasons";

export async function reportContent(input: {
  reviewId?: string;
  commentId?: string;
  quoteId?: string;
  reason: ReportReason;
  details?: string;
}) {
  return withUser(async (userId) => {
    await throttle(userId, "report", 20, 3_600_000);
    if (!(input.reason in REPORT_REASONS)) fail("Escolha um motivo.");
    const targets = [input.reviewId, input.commentId, input.quoteId].filter(
      Boolean,
    );
    if (targets.length !== 1) fail("Denúncia inválida.");
    const details =
      typeof input.details === "string" ? input.details.trim() : "";
    if (details.length > 500)
      fail("O detalhe pode ter no máximo 500 caracteres.");

    const target = input.reviewId
      ? await db.review.findUnique({
          where: { id: input.reviewId },
          select: { userId: true },
        })
      : input.commentId
        ? await db.reviewComment.findUnique({
            where: { id: input.commentId },
            select: { userId: true },
          })
        : await db.quote.findFirst({
            where: { id: input.quoteId, private: false },
            select: { userId: true },
          });
    if (!target) fail("Esse conteúdo não existe mais.");
    if (target.userId === userId)
      fail("Você não pode denunciar o próprio conteúdo.");

    const where = {
      reporterId: userId,
      status: "OPEN" as const,
      reviewId: input.reviewId ?? null,
      commentId: input.commentId ?? null,
      quoteId: input.quoteId ?? null,
    };
    if (await db.report.findFirst({ where })) return;
    const label = REPORT_REASONS[input.reason];
    await db.report.create({
      data: {
        reporterId: userId,
        reviewId: input.reviewId ?? null,
        commentId: input.commentId ?? null,
        quoteId: input.quoteId ?? null,
        reason: details ? `${label}: ${details}` : label,
      },
    });
  });
}

async function withAdmin<T>(fn: (userId: string) => Promise<T>) {
  return withUser(async (userId) => {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (!user?.isAdmin) fail("Sem permissão.");
    return fn(userId);
  });
}

function targetOf(report: {
  reviewId: string | null;
  commentId: string | null;
  quoteId: string | null;
}) {
  return {
    reviewId: report.reviewId,
    commentId: report.reviewId ? null : report.commentId,
    quoteId: report.reviewId || report.commentId ? null : report.quoteId,
  };
}

async function setHidden(
  tx: Pick<typeof db, "review" | "reviewComment" | "quote">,
  target: ReturnType<typeof targetOf>,
  hiddenAt: Date | null,
) {
  if (target.reviewId)
    await tx.review.update({
      where: { id: target.reviewId },
      data: { hiddenAt },
    });
  else if (target.commentId)
    await tx.reviewComment.update({
      where: { id: target.commentId },
      data: { hiddenAt },
    });
  else if (target.quoteId)
    await tx.quote.update({
      where: { id: target.quoteId },
      data: { hiddenAt },
    });
}

export async function resolveReport(
  reportId: string,
  action: "hide" | "dismiss",
) {
  return withAdmin(async () => {
    const report = await db.report.findUnique({ where: { id: reportId } });
    if (!report) fail("Essa denúncia não existe mais.");
    const target = targetOf(report);
    const now = new Date();
    await db.$transaction(async (tx) => {
      if (action === "hide") await setHidden(tx, target, now);
      await tx.report.updateMany({
        where: { ...target, status: "OPEN" },
        data: {
          status: action === "hide" ? "HIDDEN" : "DISMISSED",
          resolvedAt: now,
        },
      });
    });
    revalidate();
  });
}

export async function restoreContent(reportId: string) {
  return withAdmin(async () => {
    const report = await db.report.findUnique({ where: { id: reportId } });
    if (!report) fail("Essa denúncia não existe mais.");
    const target = targetOf(report);
    await setHidden(db, target, null);
    await db.report.updateMany({
      where: { ...target, status: "HIDDEN" },
      data: { status: "DISMISSED" },
    });
    revalidate();
  });
}
