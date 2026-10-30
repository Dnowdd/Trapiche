import { db } from "@/lib/db";
import { apiRoute } from "@/lib/api/http";
import { appUrl } from "@/lib/emails/layout";

export const GET = apiRoute(async ({ userId }) => {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, handle: true, bio: true, createdAt: true },
  });
  const shelf = await db.userBook.groupBy({
    by: ["status"],
    where: { userId, status: { not: null } },
    _count: { status: true },
  });
  return {
    data: {
      id: user.id,
      name: user.name,
      handle: user.handle,
      bio: user.bio,
      createdAt: user.createdAt.toISOString(),
      url: appUrl(`/u/${user.handle}`),
      shelf: Object.fromEntries(shelf.map((g) => [g.status!, g._count.status])),
    },
  };
});
