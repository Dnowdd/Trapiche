import { db } from "../db";
import { bookSummarySelect, toCover } from "../books";
import { cleanAuthor, normalize } from "../editions";
import { fmtDay, today } from "../dates";
import {
  describeChallenge,
  LONG_PAGES,
  SHORT_PAGES,
  type ChallengeKindId,
} from "../challenges";

export async function getChallenges(userId: string) {
  const challenges = await db.challenge.findMany({
    where: { userId },
    orderBy: [{ endsAt: "asc" }, { createdAt: "asc" }],
  });
  if (!challenges.length) return [];
  const from = new Date(
    Math.min(...challenges.map((c) => c.startsAt.getTime())),
  );
  const [readings, tags] = await Promise.all([
    db.reading.findMany({
      where: {
        userId,
        status: "FINISHED",
        endedAt: { gte: from },
      },
      orderBy: { endedAt: "desc" },
      select: {
        endedAt: true,
        bookId: true,
        book: { select: { ...bookSummarySelect, language: true } },
      },
    }),
    db.tag.findMany({ where: { userId }, select: { id: true, name: true } }),
  ]);
  const entries = await db.userBook.findMany({
    where: { userId, bookId: { in: readings.map((r) => r.bookId) } },
    select: { bookId: true, format: true, tags: { select: { tagId: true } } },
  });
  const entryOf = new Map(entries.map((e) => [e.bookId, e]));
  const now = today();

  return challenges.map((c) => {
    const end = new Date(c.endsAt.getTime() + 86_400_000);
    const matches = readings.filter((r) => {
      if (!r.endedAt || r.endedAt < c.startsAt || r.endedAt >= end)
        return false;
      const e = entryOf.get(r.bookId);
      const pages = r.book.pageCount ?? 0;
      switch (c.kind as ChallengeKindId) {
        case "TAG":
          return e?.tags.some((t) => t.tagId === c.value) ?? false;
        case "AUTHOR":
          return r.book.authors.some(
            (a) => normalize(cleanAuthor(a)) === normalize(c.value ?? ""),
          );
        case "LANGUAGE":
          return (r.book.language ?? "").startsWith(c.value ?? "-");
        case "FORMAT":
          return (e?.format ?? "PRINT") === c.value;
        case "LONG":
          return pages >= LONG_PAGES;
        case "SHORT":
          return pages > 0 && pages <= SHORT_PAGES;
        default:
          return true;
      }
    });
    const seen = new Set<string>();
    const unique = matches.filter((m) =>
      seen.has(m.bookId) ? false : (seen.add(m.bookId), true),
    );
    const done = unique.length;
    const tagName = tags.find((t) => t.id === c.value)?.name ?? null;
    return {
      id: c.id,
      title: c.title,
      kind: c.kind,
      value: c.value,
      detail: describeChallenge(c.kind as ChallengeKindId, c.value, tagName),
      target: c.target,
      done,
      percent: Math.min(100, Math.round((done / c.target) * 100)),
      complete: done >= c.target,
      ended: c.endsAt < now,
      startsAt: c.startsAt.toISOString().slice(0, 10),
      endsAt: c.endsAt.toISOString().slice(0, 10),
      until: fmtDay(c.endsAt),
      books: unique.slice(0, 6).map((m) => toCover(m.book)),
    };
  });
}

export type ChallengeItem = Awaited<ReturnType<typeof getChallenges>>[number];
