"use client";

import Link from "next/link";
import {
  BookCheck,
  BookmarkPlus,
  Check,
  CircleAlert,
  Handshake,
  ListPlus,
  Quote,
  Star,
  Target,
  Timer,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import BookCover from "@/components/shared/book-cover";
import { Button } from "@/components/shared/form";
import { fmtRating } from "@/components/shared/stars";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { setShelfStatus } from "@/lib/actions/shelf";
import {
  confirmAssistantAction,
  dismissAssistantAction,
} from "@/lib/actions/assistant";
import type {
  ActionCard,
  ActionKind,
  BookCard,
  ShelfStatusId,
} from "@/lib/assistant/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ShelfStatusId, string> = {
  WANT: "Quero ler",
  READING: "Lendo",
  READ: "Lido",
  ABANDONED: "Abandonado",
  REREADING: "Relendo",
};

function BookTile({
  book,
  onNavigate,
  onShelved,
}: {
  book: BookCard;
  onNavigate?: () => void;
  onShelved: (bookId: string) => void;
}) {
  const { pending, run } = useAction();
  return (
    <li className="w-26 shrink-0 snap-start">
      <Link
        prefetch={false}
        href={`/book/${book.id}`}
        onClick={onNavigate}
        className="group block rounded-md"
      >
        <BookCover
          book={book.cover}
          style={{ width: 104, height: 156 }}
          sizes="104px"
        />
        <span className="mt-2 block text-[12.5px] font-semibold leading-[1.25] text-(--ink) line-clamp-2 group-hover:underline underline-offset-2">
          {book.title}
        </span>
        <span className="mt-0.5 block text-[11px] text-(--ink-4) truncate">
          {book.author}
          {book.year ? ` · ${book.year}` : ""}
        </span>
      </Link>
      {book.status ? (
        <span className="mt-1.5 inline-flex items-center h-5.5 px-2 rounded-full bg-[rgba(var(--ink-rgb),0.07)] text-[10.5px] font-semibold text-(--ink-3) whitespace-nowrap">
          {STATUS_LABEL[book.status]}
          {book.rating ? ` · ★ ${fmtRating(book.rating)}` : ""}
        </span>
      ) : (
        <button
          type="button"
          disabled={pending}
          aria-label={`Colocar “${book.title}” em Quero ler`}
          onClick={() =>
            run(
              () => setShelfStatus(book.id, "WANT"),
              () => {
                onShelved(book.id);
                toast(`“${book.title}” está no seu Quero ler.`);
              },
              toast,
            )
          }
          className="mt-1.5 inline-flex items-center gap-1 h-6.5 px-2.5 rounded-full border border-[rgba(var(--ink-rgb),0.2)] text-[11px] font-semibold text-(--ink-2) hover:bg-(--yellow-soft) cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          <BookmarkPlus size={12} aria-hidden />
          Quero ler
        </button>
      )}
    </li>
  );
}

export function BookStrip({
  title,
  books,
  onNavigate,
  onShelved,
}: {
  title: string | null;
  books: BookCard[];
  onNavigate?: () => void;
  onShelved: (bookId: string) => void;
}) {
  return (
    <section
      aria-label={title ?? "Livros sugeridos"}
      className="animate-[rise_0.35s_cubic-bezier(0.2,0.8,0.2,1)]"
    >
      {title && (
        <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
          {title}
        </div>
      )}
      <ul
        role="list"
        className="m-0 p-0 list-none flex gap-3.5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 [scrollbar-width:thin]"
      >
        {books.map((b) => (
          <BookTile
            key={b.id}
            book={b}
            onNavigate={onNavigate}
            onShelved={onShelved}
          />
        ))}
      </ul>
    </section>
  );
}

const KIND_ICON: Record<ActionKind, LucideIcon> = {
  shelf_status: BookmarkPlus,
  finish_book: BookCheck,
  log_session: Timer,
  review: Star,
  quote: Quote,
  create_list: ListPlus,
  add_to_list: ListPlus,
  goal: Target,
  challenge: Trophy,
  loan: Handshake,
};

const STATE_LABEL: Record<ActionCard["status"], string> = {
  pending: "Para você confirmar",
  done: "Feito",
  dismissed: "Cancelado",
  failed: "Não deu certo",
};

export function ActionCardView({
  action,
  messageId,
  locked,
  onChange,
  onNavigate,
}: {
  action: ActionCard;
  messageId: string;
  locked: boolean;
  onChange: (action: ActionCard) => void;
  onNavigate?: () => void;
}) {
  const confirming = useAction();
  const dismissing = useAction();
  const Icon = KIND_ICON[action.kind];
  const pending = action.status === "pending";
  const busy = confirming.pending || dismissing.pending;

  return (
    <div
      className={cn(
        "rounded-[16px] border p-4 animate-[rise_0.35s_cubic-bezier(0.2,0.8,0.2,1)]",
        pending
          ? "border-[rgba(var(--ink-rgb),0.16)] bg-(--cream-card) shadow-[0_1px_0_rgba(var(--shadow-rgb),0.04),0_14px_30px_-22px_rgba(var(--shadow-rgb),0.5)]"
          : "border-[rgba(var(--ink-rgb),0.1)] bg-[rgba(var(--ink-rgb),0.03)]",
      )}
    >
      <div className="flex items-start gap-3">
        {action.book ? (
          <BookCover
            book={action.book.cover}
            style={{ width: 40, height: 60 }}
            sizes="40px"
          />
        ) : (
          <span className="size-10 shrink-0 rounded-[12px] bg-(--yellow) text-(--on-accent) flex items-center justify-center">
            <Icon size={18} aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
            <Icon size={11} aria-hidden />
            {STATE_LABEL[action.status]}
          </div>
          <div className="mt-0.5 text-[14px] font-bold leading-snug text-(--ink)">
            {action.title}
          </div>
          <div className="mt-0.5 text-[12.5px] leading-normal text-(--ink-3) [overflow-wrap:anywhere]">
            {action.detail}
          </div>
        </div>
      </div>

      {pending && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="h-9 px-4"
            loading={confirming.pending}
            disabled={locked || busy}
            title={locked ? "Espere a resposta terminar" : undefined}
            onClick={() =>
              confirming.run(
                () => confirmAssistantAction(messageId, action.id),
                (next) => next && onChange(next),
                toast,
              )
            }
          >
            Confirmar
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 px-3.5"
            disabled={locked || busy}
            onClick={() =>
              dismissing.run(
                () => dismissAssistantAction(messageId, action.id),
                (next) => next && onChange(next),
                toast,
              )
            }
          >
            Agora não
          </Button>
        </div>
      )}

      {action.status === "done" && (
        <div className="mt-3 flex items-center gap-2 text-[12.5px] font-semibold text-(--ink-2)">
          <span className="size-5 shrink-0 rounded-full bg-[#5e8a2e] text-white flex items-center justify-center">
            <Check size={12} strokeWidth={3} aria-hidden />
          </span>
          <span className="min-w-0">{action.result}</span>
          {action.href && (
            <Link
              prefetch={false}
              href={action.href}
              onClick={onNavigate}
              className="ml-auto shrink-0 text-(--ink-2) underline underline-offset-[3px] decoration-[rgba(var(--ink-rgb),0.35)] hover:decoration-(--ink-2)"
            >
              Ver
            </Link>
          )}
        </div>
      )}

      {action.status === "failed" && action.result && (
        <p className="m-0 mt-3 flex items-start gap-2 text-[12.5px] leading-normal text-(--danger)">
          <CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
          {action.result}
        </p>
      )}
    </div>
  );
}
