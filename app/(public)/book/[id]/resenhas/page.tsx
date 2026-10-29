import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadBook } from "@/lib/books";
import { getReviews } from "@/lib/queries/book";
import { getViewerId } from "@/lib/session";
import ReviewCard from "../_components/review-card";

const PAGE_SIZE = 20;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const book = await loadBook(id);
  return book ? { title: `Resenhas de ${book.title}` } : {};
}

export default async function ReviewsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { pagina } = await searchParams;
  const book = await loadBook(id);
  if (!book) notFound();
  const page = Math.max(1, Number(pagina) || 1);
  const viewerId = await getViewerId();
  const reviews = await getReviews(id, viewerId, {
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil(reviews.total / PAGE_SIZE));

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="pt-7 md:pt-12.5 px-4 sm:px-8 lg:px-18.75 pb-12 md:pb-15 max-w-240">
        <div className="flex items-center gap-2 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] mb-7 uppercase">
          <Link href="/" className="hover:text-(--ink-2)">
            Trapiche
          </Link>
          <span className="text-(--ink-5)">/</span>
          <Link
            href={`/book/${id}`}
            className="hover:text-(--ink-2) truncate max-w-80"
          >
            {book.title}
          </Link>
          <span className="text-(--ink-5)">/</span>
          <span className="text-(--ink-2)">Resenhas</span>
        </div>
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
          Da comunidade
        </div>
        <h1 className="m-0 mb-7 text-[34px] font-extrabold tracking-[-0.02em] text-(--ink)">
          {reviews.total.toLocaleString("pt-BR")}{" "}
          {reviews.total === 1 ? "resenha" : "resenhas"} de {book.title}
        </h1>
        {reviews.items.length === 0 ? (
          <p className="text-[14px] text-(--ink-3)">
            Ninguém escreveu uma resenha desse livro ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.items.map((r) => (
              <ReviewCard key={r.id} review={r} loggedIn={viewerId != null} />
            ))}
          </div>
        )}
        {pages > 1 && (
          <div className="mt-8 flex items-center justify-between font-mono text-[11px] text-(--ink-3) tracking-[0.04em]">
            {page > 1 ? (
              <Link
                href={`/book/${id}/resenhas?pagina=${page - 1}`}
                className="border-b border-(--ink-4) hover:text-(--ink)"
              >
                ← Anteriores
              </Link>
            ) : (
              <span />
            )}
            <span>
              Página {page} de {pages}
            </span>
            {page < pages ? (
              <Link
                href={`/book/${id}/resenhas?pagina=${page + 1}`}
                className="border-b border-(--ink-4) hover:text-(--ink)"
              >
                Próximas →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
