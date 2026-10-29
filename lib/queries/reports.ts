import { db } from "../db";
import { fmtAgo } from "../dates";

export async function isAdmin(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  return user?.isAdmin ?? false;
}

export async function getReports(status: "OPEN" | "HIDDEN" | "DISMISSED") {
  const rows = await db.report.findMany({
    where: { status },
    orderBy: { createdAt: status === "OPEN" ? "asc" : "desc" },
    take: 200,
    include: {
      reporter: { select: { name: true, handle: true } },
      review: {
        select: {
          id: true,
          text: true,
          spoiler: true,
          user: { select: { name: true, handle: true } },
          book: { select: { id: true, title: true } },
        },
      },
      comment: {
        select: {
          id: true,
          text: true,
          user: { select: { name: true, handle: true } },
          review: { select: { book: { select: { id: true, title: true } } } },
        },
      },
    },
  });
  const seen = new Map<string, (typeof items)[number]>();
  const items = rows.map((r) => {
    const target = r.review ?? r.comment;
    const book = r.review?.book ?? r.comment?.review.book ?? null;
    return {
      id: r.id,
      key: r.reviewId ?? r.commentId ?? r.id,
      kind: r.reviewId ? ("review" as const) : ("comment" as const),
      text: target?.text ?? "",
      spoiler: r.review?.spoiler ?? false,
      author: target?.user ?? null,
      book,
      reasons: [
        { reason: r.reason, by: r.reporter, when: fmtAgo(r.createdAt) },
      ],
    };
  });
  for (const item of items) {
    const prev = seen.get(item.key);
    if (prev) prev.reasons.push(...item.reasons);
    else seen.set(item.key, item);
  }
  return [...seen.values()];
}

export type ReportItem = Awaited<ReturnType<typeof getReports>>[number];
