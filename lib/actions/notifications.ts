"use server";

import { db } from "../db";
import { getNotifications } from "../queries/notifications";
import { withUser } from "./result";

export async function loadNotifications(take = 10) {
  return withUser((userId) => getNotifications(userId, take));
}

export async function markNotificationsRead() {
  return withUser(async (userId) => {
    await db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  });
}
