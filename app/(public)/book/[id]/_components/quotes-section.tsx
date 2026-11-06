"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Quote as QuoteIcon } from "lucide-react";
import QuoteCard from "@/components/quotes/quote-card";
import QuoteModal from "@/components/quotes/quote-modal";
import { Button } from "@/components/shared/form";
import { loginHref } from "@/lib/links";
import type { BookQuotes } from "@/lib/queries/quotes";
import { SectionHeader } from "./section-header";

export default function QuotesSection({
  quotes,
  bookId,
  bookTitle,
  loggedIn,
  currentPage,
}: {
  quotes: BookQuotes;
  bookId: string;
  bookTitle: string;
  loggedIn: boolean;
  currentPage: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const add = () =>
    loggedIn ? setOpen(true) : router.push(loginHref(`/book/${bookId}`));
  const empty = quotes.mine.length === 0 && quotes.community.length === 0;

  return (
    <section id="citacoes" className="scroll-mt-6">
      <SectionHeader
        eyebrow="Trechos que ficaram"
        title="Citações"
        action={
          !empty && (
            <Button variant="ghost" onClick={add} className="h-9 text-[12.5px]">
              + Guardar citação
            </Button>
          )
        }
      />

      {empty ? (
        <button
          type="button"
          onClick={add}
          className="group w-full text-left rounded-[18px] border border-dashed border-[rgba(67,62,18,0.22)] px-6 py-7 flex items-center gap-5 cursor-pointer hover:bg-(--yellow-soft) transition-colors duration-150"
        >
          <span className="size-12 shrink-0 rounded-full bg-(--ink-2) text-(--yellow) flex items-center justify-center transition-transform duration-150 group-hover:-rotate-6">
            <QuoteIcon size={20} strokeWidth={2.2} />
          </span>
          <span>
            <span className="block text-[15px] font-bold text-(--ink)">
              Nenhuma citação de {bookTitle} ainda
            </span>
            <span className="block mt-0.5 text-[13px] text-(--ink-4)">
              {loggedIn
                ? "Guarde o primeiro trecho que te marcou. Pode ser só pra você."
                : "Entre para guardar os trechos que te marcaram."}
            </span>
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-6">
          {quotes.mine.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-2.5">
                Suas citações · {quotes.mine.length}
              </div>
              <div className="flex flex-col gap-3">
                {quotes.mine.map((q) => (
                  <QuoteCard
                    key={q.id}
                    quote={q}
                    bookId={bookId}
                    bookTitle={bookTitle}
                    showAuthor={false}
                    loggedIn={loggedIn}
                  />
                ))}
              </div>
            </div>
          )}
          {quotes.community.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-2.5">
                Da comunidade · {quotes.communityTotal}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {quotes.community.map((q) => (
                  <QuoteCard
                    key={q.id}
                    quote={q}
                    bookId={bookId}
                    bookTitle={bookTitle}
                    loggedIn={loggedIn}
                  />
                ))}
              </div>
              {quotes.communityTotal > quotes.community.length && (
                <Link
                  href={`/book/${bookId}/citacoes`}
                  className="mt-4 inline-flex text-[13px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink)"
                >
                  Ver as {quotes.communityTotal} citações →
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {open && (
        <QuoteModal
          open
          onOpenChange={setOpen}
          bookId={bookId}
          bookTitle={bookTitle}
          currentPage={currentPage}
        />
      )}
    </section>
  );
}
