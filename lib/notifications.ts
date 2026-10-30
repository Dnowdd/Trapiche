import { db } from "./db";
import type { NotificationKind } from "./generated/prisma/client";

interface Notice {
  userId: string;
  actorId: string;
  kind: NotificationKind;
  reviewId?: string;
  commentId?: string;
  listId?: string;
  ticketId?: string;
}

export async function notify(n: Notice) {
  if (n.userId === n.actorId) return;
  await db.notification.create({ data: n }).catch(() => null);
}

export async function unnotify(n: Omit<Notice, "commentId">) {
  await db.notification
    .deleteMany({
      where: {
        userId: n.userId,
        actorId: n.actorId,
        kind: n.kind,
        reviewId: n.reviewId ?? null,
        listId: n.listId ?? null,
        readAt: null,
      },
    })
    .catch(() => null);
}
