import { db } from "./db";
import { MONTHS_LONG, today } from "./dates";
import { appUrl } from "./emails/layout";
import { sendMonthlyDigest, sendReadingReminder } from "./emails/send";
import { getRetrospective } from "./queries/stats";
import { unsubscribeUrl } from "./unsubscribe";

export const INACTIVE_DAYS = 10;
export const REMINDER_GAP_DAYS = 14;
const BATCH = 200;
const DAY = 86_400_000;

export function previousMonth(now: Date) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const year = m === 0 ? y - 1 : y;
  const month = m === 0 ? 12 : m;
  return { year, month, key: `${year}-${String(month).padStart(2, "0")}` };
}

export async function sendMonthlyDigests(now = today()) {
  if (now.getUTCDate() > 7) return { checked: 0, sent: 0 };
  const { year, month, key } = previousMonth(now);
  const users = await db.user.findMany({
    where: {
      monthlyDigest: true,
      emailVerified: true,
      OR: [{ lastDigestMonth: null }, { lastDigestMonth: { lt: key } }],
      createdAt: {
        lt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      },
    },
    select: { id: true, email: true, name: true, handle: true },
    take: BATCH,
  });
  let sent = 0;
  for (const user of users) {
    const retro = await getRetrospective(user.id, year, month);
    const t = retro.totals;
    if (t.books > 0 || t.pages > 0 || t.minutes > 0) {
      await sendMonthlyDigest({
        to: user.email,
        name: user.name,
        label: MONTHS_LONG[month - 1].toLowerCase(),
        books: retro.books.map((b) => ({
          title: b.title,
          author: b.author,
          rating: b.rating,
          url: appUrl(`/book/${b.id}`),
        })),
        pages: t.pages,
        hours: Math.round(t.minutes / 60),
        readingDays: t.readingDays,
        retroUrl: appUrl(
          `/u/${user.handle}/retrospectiva?ano=${year}&mes=${month}`,
        ),
        unsubscribeUrl: unsubscribeUrl(user.id, "digest"),
      });
      sent++;
    }
    await db.user.update({
      where: { id: user.id },
      data: { lastDigestMonth: key },
    });
  }
  return { checked: users.length, sent };
}

export async function sendReadingReminders(now = new Date()) {
  const inactiveSince = new Date(now.getTime() - INACTIVE_DAYS * DAY);
  const gap = new Date(now.getTime() - REMINDER_GAP_DAYS * DAY);
  const users = await db.user.findMany({
    where: {
      inactivityReminder: true,
      emailVerified: true,
      OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: gap } }],
      shelf: {
        some: {
          status: { in: ["READING", "REREADING"] },
          statusChangedAt: { lt: inactiveSince },
        },
      },
      readingSessions: { none: { createdAt: { gte: inactiveSince } } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      readingSessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      shelf: {
        where: { status: { in: ["READING", "REREADING"] } },
        orderBy: { statusChangedAt: "desc" },
        take: 3,
        select: {
          currentPage: true,
          statusChangedAt: true,
          book: { select: { id: true, title: true, pageCount: true } },
        },
      },
    },
    take: BATCH,
  });
  let sent = 0;
  for (const user of users) {
    const last =
      user.readingSessions[0]?.createdAt ??
      user.shelf.map((s) => s.statusChangedAt).find(Boolean) ??
      inactiveSince;
    const days = Math.max(
      INACTIVE_DAYS,
      Math.floor((now.getTime() - last.getTime()) / DAY),
    );
    await sendReadingReminder({
      to: user.email,
      name: user.name,
      days,
      books: user.shelf.map((s) => ({
        title: s.book.title,
        url: appUrl(`/book/${s.book.id}`),
        progress: s.book.pageCount
          ? Math.min(100, Math.round((s.currentPage / s.book.pageCount) * 100))
          : null,
      })),
      unsubscribeUrl: unsubscribeUrl(user.id, "reminder"),
    });
    await db.user.update({
      where: { id: user.id },
      data: { lastReminderAt: now },
    });
    sent++;
  }
  return { sent };
}
