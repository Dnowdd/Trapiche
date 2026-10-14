import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadBook } from "@/lib/books";
import { todayISO } from "@/lib/dates";
import { getBookPage } from "@/lib/queries/book";
import { getViewerId } from "@/lib/session";
import About from "./_components/about";
import BookHero from "./_components/book-hero";
import ByAuthor from "./_components/by-author";
import InLists from "./_components/in-lists";
import MyReading from "./_components/my-reading";
import MyReviewBlock from "./_components/my-review-block";
import OtherReviews from "./_components/other-reviews";
import RatingBlock from "./_components/rating-block";
import Related from "./_components/related";
import TechDetails from "./_components/tech-details";

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
  const data = await getBookPage(id, viewerId);
  if (!data) notFound();
  const today = todayISO();
  const loggedIn = viewerId != null;

  return (
    <div className="bg-(--cream) rounded-[30px] border-15 border-(--yellow) mx-3.75 overflow-hidden">
      <div className="pt-12.5 px-18.75 pb-15">
        <div className="flex items-center gap-2 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] mb-7 uppercase">
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
              {data.byAuthor ? (
                <a
                  href="#mais-do-autor"
                  className="text-(--ink-4) transition-colors duration-120 hover:text-(--ink-2)"
                >
                  {data.book.authors[0]}
                </a>
              ) : (
                <span>{data.book.authors[0]}</span>
              )}
            </>
          )}
          <span className="text-(--ink-5)">/</span>
          <span className="text-(--ink-2) truncate max-w-80">
            {data.book.title}
          </span>
        </div>

        <BookHero data={data} today={today} />
        <MyReading data={data} today={today} />
        <About description={data.book.description} />
        <RatingBlock rating={data.rating} />
        <MyReviewBlock data={data} />
        <OtherReviews
          bookId={data.book.id}
          reviews={data.reviews}
          loggedIn={loggedIn}
        />
        <InLists lists={data.lists} loggedIn={loggedIn} />
        <Related books={data.related} />
        <ByAuthor data={data.byAuthor} />
        <TechDetails book={data.book} language={data.languageLabel} />
      </div>
    </div>
  );
}
