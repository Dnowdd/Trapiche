import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { loadBook } from "@/lib/books";
import { todayISO } from "@/lib/dates";
import { getBookPage, openLibraryEquivalent } from "@/lib/queries/book";
import { getViewerId } from "@/lib/session";
import { authorHref } from "@/lib/links";
import BookHero from "./_components/book-hero";
import InLists from "./_components/in-lists";
import MyReading from "./_components/my-reading";
import MyReadings from "./_components/my-readings";
import ReviewsSection from "./_components/reviews-section";
import TechDetails from "./_components/tech-details";
import {
  EditionsSkeleton,
  EditionsSlot,
  MoreSkeleton,
  MoreSlot,
} from "./_components/streamed";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const book = await loadBook(id);
  if (!book) return {};
  const by = book.authors.length ? `, de ${book.authors.join(", ")}` : "";
  return {
    title: book.title,
    description: `${book.title}${by}. Veja detalhes e acompanhe sua leitura no Trapiche.`,
  };
}

export default async function BookDetailPage({ params }: Props) {
  const { id } = await params;
  const viewerId = await getViewerId();
  const book = await loadBook(id);
  const equivalent = book ? await openLibraryEquivalent(book) : null;
  if (equivalent) redirect(`/book/${equivalent}`);
  const data = await getBookPage(id, viewerId);
  if (!data) notFound();
  const today = todayISO();

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="pt-7 md:pt-10 px-4 sm:px-8 lg:px-18.75 pb-12 md:pb-15">
        <nav className="hidden md:flex items-center gap-2 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] mb-7 uppercase">
          <Link
            href="/"
            className="text-(--ink-4) transition-colors duration-120 hover:text-(--ink-2)"
          >
            Trapiche
          </Link>
          <span className="text-(--ink-5)">/</span>
          <span>Livros</span>
          {data.book.authors[0] && (
            <>
              <span className="text-(--ink-5)">/</span>
              <Link
                href={authorHref(data.book.authors[0])}
                className="text-(--ink-4) transition-colors duration-120 hover:text-(--ink-2)"
              >
                {data.book.authors[0]}
              </Link>
            </>
          )}
          <span className="text-(--ink-5)">/</span>
          <span className="text-(--ink-2) truncate max-w-80">
            {data.book.title}
          </span>
        </nav>

        <BookHero data={data} today={today} />

        <div className="mt-12 md:mt-14 grid gap-12 lg:gap-14 items-start lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-12 min-w-0">
            <MyReading data={data} today={today} />
            <MyReadings data={data} today={today} />
            <ReviewsSection data={data} />
            <InLists lists={data.lists} />
          </div>
          <aside className="min-w-0 flex flex-col gap-10 order-first lg:order-none lg:sticky lg:top-6">
            <Suspense fallback={<EditionsSkeleton />}>
              <EditionsSlot
                book={data.book}
                languageLabel={data.languageLabel}
              />
            </Suspense>
            <TechDetails book={data.book} language={data.languageLabel} />
          </aside>
        </div>

        <Suspense fallback={<MoreSkeleton />}>
          <MoreSlot book={data.book} />
        </Suspense>
      </div>
    </div>
  );
}
