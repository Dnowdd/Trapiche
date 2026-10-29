import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { authorHref } from "@/lib/links";

export const revalidate = 86400;

const base = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, base()).toString();
  const [books, lists, users] = await Promise.all([
    db.book.findMany({
      orderBy: { syncedAt: "desc" },
      take: 5000,
      select: { id: true, authors: true, syncedAt: true },
    }),
    db.list.findMany({
      where: { visibility: "PUBLIC" },
      select: { id: true, updatedAt: true },
    }),
    db.user.findMany({ select: { handle: true, updatedAt: true } }),
  ]);
  const authors = [...new Set(books.map((b) => b.authors[0]).filter(Boolean))];

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/termos"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/privacidade"), changeFrequency: "yearly", priority: 0.2 },
    ...books.map((b) => ({
      url: url(`/book/${b.id}`),
      lastModified: b.syncedAt,
      priority: 0.8,
    })),
    ...authors.map((a) => ({ url: url(authorHref(a)), priority: 0.6 })),
    ...lists.map((l) => ({
      url: url(`/lists/${l.id}`),
      lastModified: l.updatedAt,
      priority: 0.5,
    })),
    ...users.map((u) => ({
      url: url(`/u/${u.handle}`),
      lastModified: u.updatedAt,
      priority: 0.4,
    })),
  ];
}
