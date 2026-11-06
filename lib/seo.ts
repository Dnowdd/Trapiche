import { createElement } from "react";
import { authorHref } from "./links";

export const SITE_NAME = "Trapiche";
export const SITE_TAGLINE = "O porto seguro das suas leituras";
export const SITE_DESCRIPTION =
  "Diário de leituras em português: catalogue o que você lê, acompanhe o progresso, guarde citações, escreva resenhas e monte listas de livros.";

export function siteUrl(path = "") {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}${path}`;
}

export function clip(text: string | null | undefined, max = 160) {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

type Json = Record<string, unknown>;

export function JsonLd({ data }: { data: Json | Json[] }) {
  return createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    },
  });
}

export function websiteJsonLd(): Json[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl("/"),
      inLanguage: "pt-BR",
      description: SITE_DESCRIPTION,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl("/search")}?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl("/"),
      slogan: SITE_TAGLINE,
    },
  ];
}

export function breadcrumbJsonLd(items: { name: string; path?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: siteUrl(item.path) } : {}),
    })),
  };
}

export function bookJsonLd(book: {
  id: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  publisher: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  language: string | null;
  description: string | null;
  coverUrl: string | null;
  isbn13: string | null;
  isbn10: string | null;
  categories: string[];
  rating: { average: number; count: number };
  reviews: {
    name: string;
    rating: number;
    text: string | null;
    date: string;
  }[];
  series?: { name: string; position: number; slug: string } | null;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": siteUrl(`/book/${book.id}`),
    url: siteUrl(`/book/${book.id}`),
    name: book.title,
    ...(book.subtitle ? { alternativeHeadline: book.subtitle } : {}),
    author: book.authors.map((name) => ({
      "@type": "Person",
      name,
      url: siteUrl(authorHref(name)),
    })),
    ...(book.publisher
      ? { publisher: { "@type": "Organization", name: book.publisher } }
      : {}),
    ...(book.publishedDate ? { datePublished: book.publishedDate } : {}),
    ...(book.pageCount ? { numberOfPages: book.pageCount } : {}),
    ...(book.language ? { inLanguage: book.language } : {}),
    ...(book.isbn13 || book.isbn10 ? { isbn: book.isbn13 ?? book.isbn10 } : {}),
    ...(book.description ? { description: clip(book.description, 500) } : {}),
    ...(book.coverUrl ? { image: book.coverUrl } : {}),
    ...(book.categories.length ? { genre: book.categories } : {}),
    ...(book.series
      ? {
          isPartOf: {
            "@type": "BookSeries",
            name: book.series.name,
            url: siteUrl(`/serie/${book.series.slug}`),
          },
          position: book.series.position,
        }
      : {}),
    ...(book.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(book.rating.average.toFixed(2)),
            ratingCount: book.rating.count,
            bestRating: 5,
            worstRating: 0.5,
          },
        }
      : {}),
    ...(book.reviews.length
      ? {
          review: book.reviews.map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.name },
            datePublished: r.date,
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 0.5,
            },
            ...(r.text ? { reviewBody: clip(r.text, 400) } : {}),
          })),
        }
      : {}),
  };
}

export function profileJsonLd(profile: {
  user: {
    name: string;
    handle: string;
    bio: string | null;
    image: string | null;
    createdAt: Date;
  };
}): Json {
  const u = profile.user;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateCreated: u.createdAt.toISOString(),
    mainEntity: {
      "@type": "Person",
      name: u.name,
      alternateName: `@${u.handle}`,
      identifier: u.handle,
      url: siteUrl(`/u/${u.handle}`),
      ...(u.bio ? { description: clip(u.bio, 300) } : {}),
      ...(u.image ? { image: siteUrl(u.image) } : {}),
    },
  };
}

export function itemListJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  books: { id: string; title: string }[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    url: siteUrl(input.path),
    ...(input.description ? { description: clip(input.description, 300) } : {}),
    numberOfItems: input.books.length,
    itemListElement: input.books.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: siteUrl(`/book/${b.id}`),
      name: b.title,
    })),
  };
}

export function personJsonLd(input: {
  name: string;
  path: string;
  bio?: string | null;
  image?: string | null;
  works: { id: string; title: string }[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url: siteUrl(input.path),
    ...(input.bio ? { description: clip(input.bio, 300) } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.works.length
      ? {
          workExample: input.works.slice(0, 20).map((w) => ({
            "@type": "Book",
            name: w.title,
            url: siteUrl(`/book/${w.id}`),
          })),
        }
      : {}),
  };
}

export function seriesJsonLd(input: {
  name: string;
  slug: string;
  description: string | null;
  books: { id: string; title: string; position: number }[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BookSeries",
    name: input.name,
    url: siteUrl(`/serie/${input.slug}`),
    ...(input.description ? { description: clip(input.description, 300) } : {}),
    hasPart: input.books.map((b) => ({
      "@type": "Book",
      name: b.title,
      url: siteUrl(`/book/${b.id}`),
      position: b.position,
    })),
  };
}
