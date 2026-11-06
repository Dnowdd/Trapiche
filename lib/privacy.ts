import type { ProfileVisibility } from "./generated/prisma/client";

export const privacySelect = {
  profileVisibility: true,
  searchIndexing: true,
  showShelf: true,
  showDiary: true,
  showActivity: true,
  showLikes: true,
  showGoal: true,
  showCity: true,
} as const;

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  searchIndexing: boolean;
  showShelf: boolean;
  showDiary: boolean;
  showActivity: boolean;
  showLikes: boolean;
  showGoal: boolean;
  showCity: boolean;
}

export type Section = "shelf" | "diary" | "activity" | "likes" | "goal";

export interface ProfileAccess {
  canView: boolean;
  blockedBy: "private" | "members" | null;
  sections: Record<Section, boolean>;
  showCity: boolean;
  indexable: boolean;
}

export function profileAccess(
  settings: PrivacySettings,
  isOwner: boolean,
  loggedIn: boolean,
): ProfileAccess {
  if (isOwner)
    return {
      canView: true,
      blockedBy: null,
      sections: {
        shelf: true,
        diary: true,
        activity: true,
        likes: true,
        goal: true,
      },
      showCity: true,
      indexable: isIndexable(settings),
    };

  const blockedBy =
    settings.profileVisibility === "PRIVATE"
      ? "private"
      : settings.profileVisibility === "MEMBERS" && !loggedIn
        ? "members"
        : null;
  const open = blockedBy === null;
  return {
    canView: open,
    blockedBy,
    sections: {
      shelf: open && settings.showShelf,
      diary: open && settings.showDiary,
      activity: open && settings.showActivity,
      likes: open && settings.showLikes,
      goal: open && settings.showGoal,
    },
    showCity: open && settings.showCity,
    indexable: isIndexable(settings),
  };
}

export function isIndexable(settings: {
  profileVisibility: ProfileVisibility;
  searchIndexing: boolean;
}) {
  return settings.profileVisibility === "PUBLIC" && settings.searchIndexing;
}

export const indexableProfileWhere = {
  profileVisibility: "PUBLIC",
  searchIndexing: true,
} as const;

export const VISIBILITY_LABEL: Record<ProfileVisibility, string> = {
  PUBLIC: "Público",
  MEMBERS: "Só quem tem conta",
  PRIVATE: "Só eu",
};
