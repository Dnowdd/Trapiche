import { db } from "@/lib/db";
import { act, apiRoute, badParam } from "@/lib/api/http";
import { bool, oneOf, str } from "@/lib/api/write";
import {
  updateEmailPreferences,
  updatePrivacy,
  updateProfile,
} from "@/lib/actions/profile";
import { appUrl } from "@/lib/emails/layout";
import { privacySelect } from "@/lib/privacy";

async function me(userId: string) {
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
}

export const GET = apiRoute(({ userId }) => me(userId));

const FLAGS = [
  "searchIndexing",
  "showShelf",
  "showDiary",
  "showActivity",
  "showLikes",
  "showGoal",
  "showCity",
] as const;

function section(b: Record<string, unknown>, name: string) {
  const v = b[name];
  if (v === undefined) return undefined;
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw badParam(name, "use um objeto.");
  return v as Record<string, unknown>;
}

export const PATCH = apiRoute(
  async ({ userId, body }) => {
    const b = await body();
    const current = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        name: true,
        handle: true,
        bio: true,
        city: true,
        inactivityReminder: true,
        monthlyDigest: true,
        ...privacySelect,
      },
    });
    const profile = ["name", "handle", "bio", "city"].some((k) => k in b);
    const privacy = section(b, "privacy");
    const notifications = section(b, "notifications");
    if (profile)
      await act(userId, () =>
        updateProfile({
          name: str(b, "name") ?? current.name,
          handle: str(b, "handle") ?? current.handle,
          bio: b.bio === null ? "" : (str(b, "bio") ?? current.bio ?? ""),
          city: b.city === null ? "" : (str(b, "city") ?? current.city ?? ""),
        }),
      );
    if (privacy) {
      const next = {
        profileVisibility:
          oneOf(privacy, "profileVisibility", [
            "PUBLIC",
            "MEMBERS",
            "PRIVATE",
          ]) ?? current.profileVisibility,
        ...Object.fromEntries(
          FLAGS.map((f) => [f, bool(privacy, f) ?? current[f]]),
        ),
      } as Parameters<typeof updatePrivacy>[0];
      await act(userId, () => updatePrivacy(next));
    }
    if (notifications)
      await act(userId, () =>
        updateEmailPreferences({
          monthlyDigest:
            bool(notifications, "monthlyDigest") ?? current.monthlyDigest,
          inactivityReminder:
            bool(notifications, "inactivityReminder") ??
            current.inactivityReminder,
        }),
      );
    return me(userId);
  },
  { write: true },
);
