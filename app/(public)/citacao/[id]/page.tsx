import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/shared/avatar";
import BookCover from "@/components/shared/book-cover";
import { getPublicQuote } from "@/lib/queries/quotes";
import { clip, JsonLd, siteUrl } from "@/lib/seo";
import ShareQuote from "./share-quote";

interface Props {
  params: Promise<{ id: string }>;
}

const load = cache(getPublicQuote);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const quote = await load(id);
  if (!quote) return {};
  const by = quote.book.authors[0] ? `, ${quote.book.authors[0]}` : "";
  const title = `“${clip(quote.text, 70)}” · ${quote.book.title}`;
  const description = `Trecho de ${quote.book.title}${by}${quote.page ? `, página ${quote.page}` : ""}, guardado por ${quote.user.name} no Trapiche.`;
  return {
    title,
    description,
    alternates: { canonical: `/citacao/${quote.id}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/citacao/${quote.id}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function QuotePage({ params }: Props) {
  const { id } = await params;
  const quote = await load(id);
  if (!quote) notFound();
  const size =
    quote.text.length > 600
      ? "text-[19px] sm:text-[22px]"
      : quote.text.length > 280
        ? "text-[22px] sm:text-[28px]"
        : "text-[26px] sm:text-[38px]";

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Quotation",
          text: quote.text,
          url: siteUrl(`/citacao/${quote.id}`),
          creator: quote.book.authors.map((name) => ({
            "@type": "Person",
            name,
          })),
          isPartOf: {
            "@type": "Book",
            name: quote.book.title,
            url: siteUrl(`/book/${quote.book.id}`),
          },
          dateCreated: quote.createdAt.toISOString(),
        }}
      />
      <article className="relative px-5 sm:px-10 lg:px-20 py-14 md:py-24 max-w-260 mx-auto">
        <span
          aria-hidden
          className="absolute top-4 md:top-10 left-2 sm:left-6 lg:left-12 font-serif text-[140px] md:text-[220px] leading-none text-(--yellow-deep) select-none"
        >
          “
        </span>
        <blockquote
          className={`relative m-0 font-serif italic leading-[1.45] tracking-[-0.01em] text-(--ink) whitespace-pre-line ${size}`}
        >
          {quote.text}
        </blockquote>
        {quote.note && (
          <p className="relative m-0 mt-6 max-w-150 text-[15px] leading-[1.6] text-(--ink-3) border-l-2 border-(--yellow-deep) pl-4">
            {quote.note}
          </p>
        )}

        <div className="relative mt-10 md:mt-14 flex flex-col sm:flex-row sm:items-center gap-6 justify-between border-t border-(--rule) pt-7">
          <Link
            prefetch={false}
            href={`/book/${quote.book.id}`}
            className="group flex items-center gap-4 min-w-0"
          >
            <BookCover
              book={quote.book}
              size="sm"
              style={{ width: 60, height: 90, flexShrink: 0 }}
            />
            <span className="min-w-0">
              <span className="block text-[17px] font-bold text-(--ink) group-hover:underline leading-tight">
                {quote.book.title}
              </span>
              <span className="block mt-1 text-[13px] text-(--ink-4)">
                {quote.book.author}
                {quote.page ? ` · página ${quote.page}` : ""}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              prefetch={false}
              href={`/u/${quote.user.handle}`}
              className="flex items-center gap-2 text-[12.5px] text-(--ink-3) hover:text-(--ink)"
            >
              <Avatar
                name={quote.user.name}
                image={quote.user.image}
                size={26}
              />
              guardada por <strong>{quote.user.name}</strong>
            </Link>
            <ShareQuote id={quote.id} title={quote.book.title} />
          </div>
        </div>
      </article>
    </div>
  );
}
