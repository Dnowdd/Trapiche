import { db } from "../db";
import { addDays, fmtAgo, fmtJoined, today } from "../dates";

export async function getAdminOverview() {
  const weekAgo = addDays(today(), -7);
  const [
    users,
    newUsers,
    activeReaders,
    books,
    reviews,
    openTickets,
    openReports,
    recent,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.activity
      .groupBy({ by: ["userId"], where: { createdAt: { gte: weekAgo } } })
      .then((g) => g.length),
    db.userBook.count({ where: { status: { not: null } } }),
    db.review.count(),
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        handle: true,
        image: true,
        createdAt: true,
        emailVerified: true,
        _count: { select: { shelf: { where: { status: { not: null } } } } },
      },
    }),
  ]);
  return {
    stats: { users, newUsers, activeReaders, books, reviews },
    queues: { openTickets, openReports },
    recent: recent.map((u) => ({
      ...u,
      joined: fmtAgo(u.createdAt),
      shelf: u._count.shelf,
    })),
  };
}

export const USERS_PAGE = 30;

export async function searchUsers(query: string, page: number) {
  const q = query.trim().replace(/^@/, "");
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { handle: { contains: q.toLowerCase() } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [{ isAdmin: "desc" }, { createdAt: "desc" }],
      skip: page * USERS_PAGE,
      take: USERS_PAGE,
      select: {
        id: true,
        name: true,
        handle: true,
        email: true,
        image: true,
        isAdmin: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            shelf: { where: { status: { not: null } } },
            reviews: true,
            supportTickets: true,
          },
        },
      },
    }),
    db.user.count({ where }),
  ]);
  return {
    total,
    users: rows.map((u) => ({
      ...u,
      joined: fmtJoined(u.createdAt),
      shelf: u._count.shelf,
      reviews: u._count.reviews,
      tickets: u._count.supportTickets,
    })),
  };
}

export type AdminUser = Awaited<
  ReturnType<typeof searchUsers>
>["users"][number];
