"use server";

import { refresh } from "next/cache";
import { db } from "../db";
import { fail, withUser } from "./result";
import { REPORT_REASONS, type ReportReason } from "../report-reasons";

export async function reportContent(input: {
  reviewId?: string;
  commentId?: string;
  reason: ReportReason;
  details?: string;
}) {
  return withUser(async (userId) => {
    if (!(input.reason in REPORT_REASONS)) fail("Escolha um motivo.");
    if (!input.reviewId === !input.commentId) fail("Denúncia inválida.");
    const details =
      typeof input.details === "string" ? input.details.trim() : "";
    if (details.length > 500)
      fail("O detalhe pode ter no máximo 500 caracteres.");

    const target = input.reviewId
      ? await db.review.findUnique({
          where: { id: input.reviewId },
          select: { userId: true },
        })
      : await db.reviewComment.findUnique({
          where: { id: input.commentId },
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
    };
    if (await db.report.findFirst({ where })) return;
    const label = REPORT_REASONS[input.reason];
    await db.report.create({
      data: {
        reporterId: userId,
        reviewId: input.reviewId ?? null,
        commentId: input.commentId ?? null,
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
}) {
  return report.reviewId
    ? { reviewId: report.reviewId, commentId: null }
    : { reviewId: null, commentId: report.commentId };
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
      if (action === "hide") {
        if (target.reviewId)
          await tx.review.update({
            where: { id: target.reviewId },
            data: { hiddenAt: now },
          });
        else
          await tx.reviewComment.update({
            where: { id: target.commentId! },
            data: { hiddenAt: now },
          });
      }
      await tx.report.updateMany({
        where: { ...target, status: "OPEN" },
        data: {
          status: action === "hide" ? "HIDDEN" : "DISMISSED",
          resolvedAt: now,
        },
      });
    });
    refresh();
  });
}

export async function restoreContent(reportId: string) {
  return withAdmin(async () => {
    const report = await db.report.findUnique({ where: { id: reportId } });
    if (!report) fail("Essa denúncia não existe mais.");
    const target = targetOf(report);
    if (target.reviewId)
      await db.review.update({
        where: { id: target.reviewId },
        data: { hiddenAt: null },
      });
    else
      await db.reviewComment.update({
        where: { id: target.commentId! },
        data: { hiddenAt: null },
      });
    await db.report.updateMany({
      where: { ...target, status: "HIDDEN" },
      data: { status: "DISMISSED" },
    });
    refresh();
  });
}
