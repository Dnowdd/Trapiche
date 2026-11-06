import { db } from "../db";
import { fmtAgo } from "../dates";

export async function getImportState(userId: string, jobId: string) {
  const job = await db.importJob.findFirst({
    where: { id: jobId, userId },
  });
  if (!job) return null;
  const [groups, problems] = await Promise.all([
    db.importRow.groupBy({
      by: ["status"],
      where: { jobId },
      _count: { status: true },
    }),
    db.importRow.findMany({
      where: { jobId, status: { in: ["NOT_FOUND", "FAILED"] } },
      orderBy: { index: "asc" },
      take: 500,
      select: { id: true, title: true, author: true, isbn: true, status: true },
    }),
  ]);
  const count = (s: string) =>
    groups.find((g) => g.status === s)?._count.status ?? 0;
  const done = job.total - count("PENDING");
  return {
    id: job.id,
    source: job.source,
    fileName: job.fileName,
    status: job.status,
    total: job.total,
    done,
    imported: count("IMPORTED"),
    skipped: count("SKIPPED"),
    notFound: count("NOT_FOUND"),
    failed: count("FAILED"),
    when: fmtAgo(job.createdAt),
    problems,
  };
}

export type ImportState = NonNullable<
  Awaited<ReturnType<typeof getImportState>>
>;

export async function getImportHistory(userId: string) {
  const jobs = await db.importJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true },
  });
  const states = await Promise.all(
    jobs.map((j) => getImportState(userId, j.id)),
  );
  return states.filter((s): s is ImportState => s != null);
}
