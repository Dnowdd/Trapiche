import { db } from "../db";
import { bookSummarySelect, toCover } from "../books";
import { fmtAgo } from "../dates";
import { initialsOf } from "./book";
import type { Prisma } from "../generated/prisma/client";

export function visibleListsWhere(
  viewerId: string | null,
): Prisma.ListWhereInput {
  if (!viewerId) return { visibility: "PUBLIC" };
  return {
    OR: [{ visibility: "PUBLIC" }, { members: { some: { userId: viewerId } } }],
  };
}

export function byLine(
  owner: { name: string },
  membersCount: number,
  ownerIsViewer: boolean,
) {
  const base = ownerIsViewer ? "Você" : owner.name;
  const others = membersCount - 1;
  return others > 0 ? `${base} e + ${others}` : base;
}

export async function getListPage(id: string, viewerId: string | null) {
  const list = await db.list.findFirst({
    where: { id, ...visibleListsWhere(viewerId) },
    include: {
      owner: { select: { id: true, name: true, handle: true, image: true } },
      members: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, handle: true, image: true } },
        },
      },
      items: {
        orderBy: { createdAt: "desc" },
        include: {
          book: { select: bookSummarySelect },
          addedBy: { select: { name: true, handle: true } },
        },
      },
      _count: { select: { followers: true } },
    },
  });
  if (!list) return null;

  const me = viewerId
    ? list.members.find((m) => m.userId === viewerId)
    : undefined;
  const following =
    viewerId && !me
      ? Boolean(
          await db.listFollow.findUnique({
            where: { listId_userId: { listId: id, userId: viewerId } },
          }),
        )
      : false;

  return {
    id: list.id,
    title: list.title,
    note: list.note,
    visibility: list.visibility,
    updated: fmtAgo(list.updatedAt),
    owner: {
      ...list.owner,
      initials: initialsOf(list.owner.name),
    },
    by: byLine(list.owner, list.members.length, list.ownerId === viewerId),
    followers: list._count.followers,
    members: list.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      handle: m.user.handle,
      initials: initialsOf(m.user.name),
      image: m.user.image,
      role: m.role,
    })),
    items: list.items.map((i) => ({
      book: toCover(i.book),
      addedBy: i.addedBy.name,
      addedByHandle: i.addedBy.handle,
      when: fmtAgo(i.createdAt),
    })),
    viewer: {
      loggedIn: viewerId != null,
      isOwner: list.ownerId === viewerId,
      isMember: Boolean(me),
      pinned: me?.pinned ?? false,
      following,
    },
  };
}

export type ListPageData = NonNullable<Awaited<ReturnType<typeof getListPage>>>;
