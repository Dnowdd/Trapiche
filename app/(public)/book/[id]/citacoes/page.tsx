import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadBook } from "@/lib/books";
import { getQuotesPage } from "@/lib/queries/quotes";
import { getViewerId } from "@/lib/session";
import QuoteCard from "@/components/quotes/quote-card";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const { pagina } = await searchParams;
  const book = await loadBook(id);
  if (!book) return {};
  const by = book.authors[0] ? `, de ${book.authors[0]}` : "";
  const page = Math.max(1, Number(pagina) || 1);
  return {
    title: `Citações de ${book.title}${page > 1 ? ` · página ${page}` : ""}`,
    description: `Os trechos de ${book.title}${by} que marcaram os leitores do Trapiche.`,
    alternates: {
      canonical: `/book/${id}/citacoes${page > 1 ? `?pagina=${page}` : ""}`,
    },
  };
}

export default async function QuotesPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { pagina } = await searchParams;
  const book = await loadBook(id);
  if (!book) notFound();
  const page = Math.max(1, Number(pagina) || 1);
  const viewerId = await getViewerId();
  const quotes = await getQuotesPage(id, page, viewerId);

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="pt-7 md:pt-12.5 px-4 sm:px-8 lg:px-18.75 pb-12 md:pb-15 max-w-240">
        <div className="flex items-center gap-2 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] mb-7 uppercase">
          <Link prefetch={false} href="/" className="hover:text-(--ink-2)">
            Trapiche
          </Link>
          <span className="text-(--ink-5)">/</span>
          <Link
            prefetch={false}
            href={`/book/${id}`}
            className="hover:text-(--ink-2) truncate max-w-80"
          >
            {book.title}
          </Link>
          <span className="text-(--ink-5)">/</span>
          <span className="text-(--ink-2)">Citações</span>
        </div>
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
          Trechos que ficaram
        </div>
        <h1 className="m-0 mb-7 text-[34px] font-extrabold tracking-[-0.02em] text-(--ink)">
          {quotes.total.toLocaleString("pt-BR")}{" "}
          {quotes.total === 1 ? "citação" : "citações"} de {book.title}
        </h1>
        {quotes.items.length === 0 ? (
          <p className="text-[14px] text-(--ink-3)">
            Ninguém guardou uma citação pública desse livro ainda.{" "}
            <Link
              prefetch={false}
              href={`/book/${id}#citacoes`}
              className="underline"
            >
              Seja a primeira pessoa.
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {quotes.items.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                bookId={id}
                bookTitle={book.title}
                loggedIn={viewerId != null}
              />
            ))}
          </div>
        )}
        {quotes.pages > 1 && (
          <div className="mt-8 flex items-center justify-between font-mono text-[11px] text-(--ink-3) tracking-[0.04em]">
            {page > 1 ? (
              <Link
                prefetch={false}
                href={`/book/${id}/citacoes?pagina=${page - 1}`}
                className="border-b border-(--ink-4) hover:text-(--ink)"
              >
                ← Anteriores
              </Link>
            ) : (
              <span />
            )}
            <span>
              Página {page} de {quotes.pages}
            </span>
            {page < quotes.pages ? (
              <Link
                prefetch={false}
                href={`/book/${id}/citacoes?pagina=${page + 1}`}
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
