"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/shared/avatar";
import BookCover from "@/components/shared/book-cover";
import ReportModal from "@/components/moderation/report-modal";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { shareLink } from "@/components/reading/share";
import { deleteQuote } from "@/lib/actions/quotes";
import type { QuoteItem } from "@/lib/queries/quotes";
import type { Book } from "@/lib/types/book";
import { cn } from "@/lib/utils";
import QuoteModal from "./quote-modal";

const iconBtn =
  "h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-[12px] text-(--ink-4) hover:text-(--ink-2) hover:bg-[rgba(67,62,18,0.06)] cursor-pointer";

export default function QuoteCard({
  quote,
  bookId,
  bookTitle,
  book,
  showAuthor = true,
  loggedIn,
  tone = "card",
}: {
  quote: QuoteItem;
  bookId: string;
  bookTitle: string;
  book?: Book;
  showAuthor?: boolean;
  loggedIn: boolean;
  tone?: "card" | "plain";
}) {
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const { pending, run } = useAction();
  const long = quote.text.length > 420;
  const [expanded, setExpanded] = useState(!long);

  return (
    <figure
      className={cn(
        "relative m-0 flex gap-4",
        tone === "card" &&
          "rounded-[16px] border border-[rgba(67,62,18,0.09)] bg-(--cream-card) px-5 sm:px-6 pt-6 pb-4",
      )}
    >
      {book && (
        <Link href={`/book/${book.id}`} className="shrink-0 hidden sm:block">
          <BookCover book={book} size="sm" style={{ width: 56, height: 84 }} />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        {!book && (
          <span
            aria-hidden
            className="absolute -top-1 left-4 font-serif text-[64px] leading-none text-(--yellow-deep) select-none pointer-events-none"
          >
            “
          </span>
        )}
        <blockquote
          className={cn(
            "relative m-0 font-serif italic text-[16.5px] sm:text-[17.5px] leading-[1.6] text-(--ink-2) whitespace-pre-line",
            !expanded && "line-clamp-6",
          )}
        >
          {quote.text}
        </blockquote>
        {long && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px cursor-pointer hover:text-(--ink)"
          >
            {expanded ? "Mostrar menos" : "Ler tudo"}
          </button>
        )}
        {quote.note && (
          <p className="m-0 mt-3 text-[13px] text-(--ink-3) leading-normal border-l-2 border-(--yellow-deep) pl-3">
            {quote.note}
          </p>
        )}
        <figcaption className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          {showAuthor && (
            <Link
              href={`/u/${quote.user.handle}`}
              className="flex items-center gap-2 min-w-0 group"
            >
              <Avatar
                name={quote.user.name}
                image={quote.user.image}
                size={24}
              />
              <span className="text-[12.5px] font-semibold text-(--ink-2) group-hover:underline truncate">
                {quote.user.name}
              </span>
            </Link>
          )}
          {book && (
            <Link
              href={`/book/${book.id}`}
              className="text-[12.5px] font-semibold text-(--ink-2) hover:underline truncate"
            >
              {book.title}
            </Link>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-(--ink-4)">
            {quote.page ? `p. ${quote.page} · ` : ""}
            {quote.when}
          </span>
          {quote.private && (
            <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded bg-[rgba(67,62,18,0.07)] text-(--ink-3)">
              Só para mim
            </span>
          )}
          {quote.hidden && (
            <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded bg-[rgba(154,74,42,0.1)] text-[#9a4a2a]">
              Oculta pela moderação
            </span>
          )}
          <span className="ml-auto flex items-center">
            {!quote.private && !quote.hidden && (
              <button
                type="button"
                className={iconBtn}
                onClick={() =>
                  shareLink(`/citacao/${quote.id}`, `Citação de ${bookTitle}`)
                }
              >
                Compartilhar
              </button>
            )}
            {quote.mine ? (
              <>
                <button
                  type="button"
                  className={iconBtn}
                  onClick={() => setEditing(true)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className={iconBtn}
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm("Apagar esta citação?")) return;
                    run(
                      () => deleteQuote(quote.id),
                      () => toast("Citação apagada."),
                      toast,
                    );
                  }}
                >
                  Apagar
                </button>
              </>
            ) : (
              loggedIn && (
                <button
                  type="button"
                  className={iconBtn}
                  onClick={() => setReporting(true)}
                >
                  Denunciar
                </button>
              )
            )}
          </span>
        </figcaption>
      </div>
      {editing && (
        <QuoteModal
          open
          onOpenChange={setEditing}
          bookId={bookId}
          bookTitle={bookTitle}
          initial={quote}
        />
      )}
      {reporting && (
        <ReportModal
          open
          onOpenChange={setReporting}
          target={{ quoteId: quote.id }}
        />
      )}
    </figure>
  );
}
