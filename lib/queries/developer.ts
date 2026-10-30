import { db } from "../db";
import { fmtAgo, fmtDay, dayOf } from "../dates";

export async function getDeveloper(userId: string) {
  const [user, keys] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { developerSince: true },
    }),
    db.apiKey.findMany({
      where: { userId },
      orderBy: [
        { revokedAt: { sort: "asc", nulls: "first" } },
        { createdAt: "desc" },
      ],
      take: 30,
      select: {
        id: true,
        name: true,
        prefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    }),
  ]);
  return {
    enabled: user.developerSince != null,
    keys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      created: fmtDay(dayOf(k.createdAt)),
      lastUsed: k.lastUsedAt ? fmtAgo(k.lastUsedAt) : null,
      revoked: k.revokedAt != null,
    })),
  };
}

export type DeveloperData = Awaited<ReturnType<typeof getDeveloper>>;
