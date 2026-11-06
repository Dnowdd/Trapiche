import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { authorHref } from "@/lib/links";
import { indexableProfileWhere } from "@/lib/privacy";

export const revalidate = 86400;

const base = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, base()).toString();
  const [books, lists, users, series, quotes, reviewed] = await Promise.all([
    db.book.findMany({
      orderBy: { syncedAt: "desc" },
      take: 20000,
      select: { id: true, authors: true, syncedAt: true },
    }),
    db.list.findMany({
      where: { visibility: "PUBLIC", items: { some: {} } },
      select: { id: true, updatedAt: true },
    }),
    db.user.findMany({
      where: indexableProfileWhere,
      select: { handle: true, updatedAt: true },
    }),
    db.series.findMany({
      where: { works: { some: {} } },
      select: { slug: true, updatedAt: true },
    }),
    db.quote.findMany({
      where: { private: false, hiddenAt: null },
      orderBy: { createdAt: "desc" },
      take: 10000,
      select: { id: true, updatedAt: true },
    }),
    db.review.groupBy({
      by: ["bookId"],
      where: { hiddenAt: null, text: { not: null } },
      _max: { updatedAt: true },
    }),
  ]);
  const authors = [
    ...new Set(
      books
        .map((b) => b.authors[0])
        .filter((a) => a && !/^\[|not identified|desconhecid/i.test(a)),
    ),
  ];

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/search"), changeFrequency: "monthly", priority: 0.3 },
    { url: url("/termos"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/privacidade"), changeFrequency: "yearly", priority: 0.2 },
    ...books.map((b) => ({
      url: url(`/book/${b.id}`),
      lastModified: b.syncedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...reviewed.map((r) => ({
      url: url(`/book/${r.bookId}/resenhas`),
      lastModified: r._max.updatedAt ?? undefined,
      priority: 0.5,
    })),
    ...authors.map((a) => ({ url: url(authorHref(a)), priority: 0.6 })),
    ...series.map((s) => ({
      url: url(`/serie/${s.slug}`),
      lastModified: s.updatedAt,
      priority: 0.6,
    })),
    ...lists.map((l) => ({
      url: url(`/lists/${l.id}`),
      lastModified: l.updatedAt,
      priority: 0.5,
    })),
    ...quotes.map((q) => ({
      url: url(`/citacao/${q.id}`),
      lastModified: q.updatedAt,
      priority: 0.4,
    })),
    ...users.map((u) => ({
      url: url(`/u/${u.handle}`),
      lastModified: u.updatedAt,
      priority: 0.4,
    })),
  ];
}
