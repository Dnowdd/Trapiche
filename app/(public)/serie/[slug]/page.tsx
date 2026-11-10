import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookCover from "@/components/shared/book-cover";
import { getSeriesPage } from "@/lib/queries/series";
import { getViewerId } from "@/lib/session";
import { SHELF_LABEL } from "@/lib/queries/profile";
import {
  breadcrumbJsonLd,
  clip,
  JsonLd,
  seriesJsonLd,
  SITE_NAME,
} from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

const fmtPos = (n: number) => n.toLocaleString("pt-BR");

function authorsOf(series: { items: { book: { author: string } }[] }) {
  return [...new Set(series.items.map((i) => i.book.author))].slice(0, 3);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesPage(slug, null);
  if (!series) return {};
  const authors = authorsOf(series);
  const title = `${series.name}: ordem dos livros`;
  const description = series.description
    ? clip(series.description, 158)
    : `Os ${series.total} livros de ${series.name}${authors.length ? `, de ${authors.join(", ")}` : ""}, na ordem certa de leitura.`;
  return {
    title,
    description,
    alternates: { canonical: `/serie/${series.slug}` },
    openGraph: { title, description, url: `/serie/${series.slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const viewerId = await getViewerId();
  const series = await getSeriesPage(slug, viewerId);
  if (!series || series.total === 0) notFound();
  const authors = authorsOf(series);
  const progress = series.total ? (series.read / series.total) * 100 : 0;

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <JsonLd
        data={[
          seriesJsonLd({
            name: series.name,
            slug: series.slug,
            description: series.description,
            books: series.items.map((i) => ({
              id: i.book.id,
              title: i.book.title,
              position: i.position,
            })),
          }),
          breadcrumbJsonLd([
            { name: SITE_NAME, path: "/" },
            { name: "Séries" },
            { name: series.name, path: `/serie/${series.slug}` },
          ]),
        ]}
      />
      <div className="pt-7 md:pt-10 px-4 sm:px-8 lg:px-18.75 pb-12 md:pb-15">
        <nav className="hidden md:flex items-center gap-2 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] mb-7 uppercase">
          <Link prefetch={false} href="/" className="hover:text-(--ink-2)">
            Trapiche
          </Link>
          <span className="text-(--ink-5)">/</span>
          <span>Séries</span>
          <span className="text-(--ink-5)">/</span>
          <span className="text-(--ink-2)">{series.name}</span>
        </nav>

        <section className="pb-8 border-b border-(--rule) grid gap-8 md:grid-cols-[minmax(0,1fr)_280px] md:items-end">
          <div className="min-w-0">
            <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase">
              Série · {series.total} {series.total === 1 ? "livro" : "livros"}
            </div>
            <h1 className="m-0 mt-2 text-[34px] md:text-[48px] font-extrabold tracking-[-0.03em] leading-[1.02] text-(--ink)">
              {series.name}
            </h1>
            {authors.length > 0 && (
              <div className="mt-2 text-[15px] text-(--ink-3)">
                de {authors.join(", ")}
              </div>
            )}
            {series.description && (
              <p className="m-0 mt-4 max-w-160 text-[15px] leading-[1.6] text-(--ink-3) whitespace-pre-line">
                {series.description}
              </p>
            )}
          </div>
          {viewerId && (
            <div className="rounded-[16px] bg-(--ink-2) text-(--cream) p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--yellow)">
                Seu progresso
              </div>
              <div className="mt-1 text-[26px] font-extrabold tracking-[-0.02em]">
                {series.read} de {series.total}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-[rgba(255,248,213,0.14)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-(--yellow)"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {series.next ? (
                <Link
                  prefetch={false}
                  href={`/book/${series.next.book.id}`}
                  className="mt-3 block text-[12.5px] hover:underline"
                >
                  Próximo: <strong>{series.next.book.title}</strong> →
                </Link>
              ) : (
                series.read === 0 && (
                  <Link
                    prefetch={false}
                    href={`/book/${series.items[0].book.id}`}
                    className="mt-3 block text-[12.5px] hover:underline"
                  >
                    Comece pelo livro {fmtPos(series.items[0].position)} →
                  </Link>
                )
              )}
            </div>
          )}
        </section>

        <ol className="m-0 mt-8 p-0 list-none flex flex-col">
          {series.items.map((item, i) => (
            <li
              key={item.workId}
              className="relative grid grid-cols-[56px_72px_minmax(0,1fr)] sm:grid-cols-[72px_88px_minmax(0,1fr)] gap-4 sm:gap-6 items-center py-4"
            >
              {i < series.items.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-7 sm:left-9 top-14 bottom-0 w-px bg-(--rule) translate-y-2"
                />
              )}
              <span className="relative justify-self-center size-12 sm:size-14 rounded-full bg-(--yellow) border-[1.5px] border-(--ink-2) flex items-center justify-center text-[18px] sm:text-[20px] font-extrabold text-(--ink) tabular-nums">
                {fmtPos(item.position)}
              </span>
              <Link
                prefetch={false}
                href={`/book/${item.book.id}`}
                className="transition-transform duration-150 hover:-translate-y-1"
              >
                <BookCover
                  book={item.book}
                  size="sm"
                  style={{ width: "100%", aspectRatio: "2/3" }}
                />
              </Link>
              <div className="min-w-0">
                <Link
                  prefetch={false}
                  href={`/book/${item.book.id}`}
                  className="text-[17px] sm:text-[19px] font-bold tracking-[-0.01em] text-(--ink) hover:underline leading-tight"
                >
                  {item.book.title}
                </Link>
                <div className="mt-1 text-[13px] text-(--ink-4)">
                  {item.book.author}
                  {item.book.pages ? ` · ${item.book.pages} páginas` : ""}
                </div>
                {item.status && (
                  <span className="mt-2 inline-flex font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-1 rounded-full bg-(--ink-2) text-(--yellow)">
                    {SHELF_LABEL[item.status]}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
