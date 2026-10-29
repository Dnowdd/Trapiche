import { db } from "../db";
import { fmtAgo } from "../dates";
import { initialsOf } from "./book";

export async function getNotifications(userId: string, take = 30) {
  const [rows, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        actor: { select: { name: true, handle: true } },
        review: { select: { book: { select: { id: true, title: true } } } },
        list: { select: { id: true, title: true } },
      },
    }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);
  return {
    unread,
    items: rows.map((n) => {
      const book = n.review?.book;
      const target =
        n.kind === "REVIEW_LIKED" || n.kind === "REVIEW_COMMENTED"
          ? book?.title
          : n.list?.title;
      const text = {
        REVIEW_LIKED: `curtiu sua resenha de ${target}`,
        REVIEW_COMMENTED: `comentou na sua resenha de ${target}`,
        LIST_FOLLOWED: `começou a seguir sua lista ${target}`,
        LIST_MEMBER_ADDED: `te adicionou na lista ${target}`,
      }[n.kind];
      const href = book
        ? `/book/${book.id}#avaliacoes`
        : n.list
          ? `/lists/${n.list.id}`
          : `/u/${n.actor.handle}`;
      return {
        id: n.id,
        actor: n.actor.name,
        initials: initialsOf(n.actor.name),
        text,
        href,
        when: fmtAgo(n.createdAt),
        unread: n.readAt === null,
      };
    }),
  };
}

export type NotificationItem = Awaited<
  ReturnType<typeof getNotifications>
>["items"][number];
