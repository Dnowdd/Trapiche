import { db } from "@/lib/db";
import { apiRoute } from "@/lib/api/http";
import { appUrl } from "@/lib/emails/layout";
import { privacySelect } from "@/lib/privacy";

export const GET = apiRoute(async ({ userId }) => {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      handle: true,
      bio: true,
      city: true,
      image: true,
      createdAt: true,
      inactivityReminder: true,
      monthlyDigest: true,
      ...privacySelect,
    },
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
      city: user.city,
      image: user.image?.startsWith("/") ? appUrl(user.image) : user.image,
      createdAt: user.createdAt.toISOString(),
      privacy: {
        profileVisibility: user.profileVisibility,
        searchIndexing: user.searchIndexing,
        showShelf: user.showShelf,
        showDiary: user.showDiary,
        showActivity: user.showActivity,
        showLikes: user.showLikes,
        showGoal: user.showGoal,
        showCity: user.showCity,
      },
      notifications: {
        monthlyDigest: user.monthlyDigest,
        inactivityReminder: user.inactivityReminder,
      },
      url: appUrl(`/u/${user.handle}`),
      shelf: Object.fromEntries(shelf.map((g) => [g.status!, g._count.status])),
    },
  };
});
