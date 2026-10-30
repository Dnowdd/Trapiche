import type { Prisma } from "../generated/prisma/client";
import { appUrl } from "../emails/layout";
import { iso } from "./serialize";

export const visibleTo = (userId: string): Prisma.ListWhereInput => ({
  OR: [{ visibility: "PUBLIC" }, { members: { some: { userId } } }],
});

export const apiListSelect = {
  id: true,
  title: true,
  note: true,
  visibility: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { handle: true } },
  _count: { select: { items: true, followers: true } },
} as const;

export function apiList(l: {
  id: string;
  title: string;
  note: string | null;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
  owner: { handle: string };
  _count: { items: number; followers: number };
}) {
  return {
    id: l.id,
    title: l.title,
    note: l.note,
    visibility: l.visibility,
    owner: l.owner.handle,
    books: l._count.items,
    followers: l._count.followers,
    createdAt: iso(l.createdAt),
    updatedAt: iso(l.updatedAt),
    url: appUrl(`/lists/${l.id}`),
  };
}
