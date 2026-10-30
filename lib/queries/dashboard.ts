import { db } from "../db";
import { bookSummarySelect, toCover } from "../books";
import { fmtAgo, today } from "../dates";
import { getFeaturedBooks } from "@/app/catalog";
import { getHomePopular } from "./home";
import { getReadingNow } from "./profile";
import { getGoal } from "./stats";

const greetingFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "numeric",
  hourCycle: "h23",
});

const PICKS = 12;

const normTitle = (title: string) =>
  title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function greeting(now = new Date()) {
  const hour = Number(greetingFmt.format(now));
  if (hour < 5) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export async function getDashboard(userId: string) {
  const year = today().getUTCFullYear();
  const [user, readingNow, goal, pile, shelfCount, shelfIds, popular] =
    await Promise.all([
      db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { name: true, handle: true, image: true, bio: true },
      }),
      getReadingNow(userId),
      getGoal(userId, year),
      db.userBook.findMany({
        where: { userId, status: "WANT" },
        orderBy: { statusChangedAt: "desc" },
        take: 6,
        include: { book: { select: bookSummarySelect } },
      }),
      db.userBook.count({ where: { userId, status: { not: null } } }),
      db.userBook.findMany({
        where: { userId, status: { not: null } },
        select: {
          bookId: true,
          book: { select: { workId: true, title: true } },
        },
      }),
      getHomePopular(18),
    ]);

  const onShelf = new Set(
    shelfIds.flatMap((s) => [s.bookId, s.book.workId].filter(Boolean)),
  );
  const shelfTitles = new Set(shelfIds.map((s) => normTitle(s.book.title)));
  const seen = new Set<string>();
  const picks = [...popular.map((p) => p.book), ...(await getFeaturedBooks(80))]
    .filter((b) => {
      const title = normTitle(b.title);
      if (seen.has(title)) return false;
      seen.add(title);
      return (
        !onShelf.has(b.id) &&
        !(b.googleId && onShelf.has(b.googleId)) &&
        !shelfTitles.has(title)
      );
    })
    .slice(0, PICKS);
  const steps = {
    photo: user.image != null,
    books: shelfCount >= 3,
    goal: goal.target != null,
    bio: Boolean(user.bio),
  };

  return {
    user,
    readingNow,
    goal,
    pile: pile.map((p) => ({
      book: toCover(p.book),
      since: p.statusChangedAt ? fmtAgo(p.statusChangedAt) : null,
    })),
    shelfCount,
    steps,
    onboarding: Object.values(steps).some((done) => !done),
    picks,
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;
