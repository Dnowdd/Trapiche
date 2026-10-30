"use client";

import { useOptimistic, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Heart,
  ListPlus,
  RotateCcw,
  Share2,
  Star,
  X,
} from "lucide-react";
import BookCover from "@/components/shared/book-cover";
import { toast } from "@/components/shared/toast";
import FinishModal from "@/components/reading/finish-modal";
import AbandonModal from "@/components/reading/abandon-modal";
import ReviewModal from "@/components/reading/review-modal";
import AddToListModal from "@/components/lists/add-to-list-modal";
import { useAction } from "@/components/reading/use-action";
import { shareLink } from "@/components/reading/share";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  setShelfStatus,
  switchEdition,
  toggleBookLike,
  toggleFavorite,
} from "@/lib/actions/shelf";
import type { BookPageData } from "@/lib/queries/book";
import { categoryLabels } from "@/lib/categories";
import { authorHref, publisherHref, loginHref } from "@/lib/links";
import Stars from "@/components/shared/stars";
import Synopsis from "./synopsis";

type Status = "READING" | "WANT" | "READ" | "ABANDONED" | "REREADING";

interface ViewerState {
  liked: boolean;
  favorite: boolean;
  status: Status | null;
}

const STATUSES: { id: Status; label: string }[] = [
  { id: "WANT", label: "Quero ler" },
  { id: "READING", label: "Lendo" },
  { id: "READ", label: "Lido" },
  { id: "REREADING", label: "Relendo" },
  { id: "ABANDONED", label: "Abandonei" },
];

const menuItem =
  "gap-2.5 cursor-pointer px-3 py-2 text-[13px] text-(--ink-2) rounded-[8px] focus:bg-[rgba(67,62,18,0.06)] focus:text-(--ink-2)";

const iconButton =
  "w-10 h-10 rounded-[10px] border flex items-center justify-center cursor-pointer transition-[background,color,border-color] duration-120 disabled:cursor-wait";

function iconButtonState(active: boolean) {
  return active
    ? "bg-(--yellow) border-(--yellow-deep) text-(--ink)"
    : "bg-(--cream-card) border-[rgba(67,62,18,0.14)] text-(--ink-3) hover:text-(--ink) hover:bg-(--yellow-soft)";
}

interface BookHeroProps {
  data: BookPageData;
  today: string;
}

export default function BookHero({ data, today }: BookHeroProps) {
  const router = useRouter();
  const { book, rating, viewer } = data;
  const loggedIn = viewer != null;
  const [modal, setModal] = useState<
    null | "finish" | "abandon" | "review" | "lists"
  >(null);
  const { pending, run } = useAction();
  const [opt, patch] = useOptimistic<ViewerState, Partial<ViewerState>>(
    {
      liked: viewer?.liked ?? false,
      favorite: viewer?.favorite ?? false,
      status: viewer?.status ?? null,
    },
    (state, change: Partial<ViewerState>) => ({ ...state, ...change }),
  );

  const guard = (fn: () => void) => () => {
    if (!loggedIn) {
      router.push(loginHref());
      return;
    }
    fn();
  };

  const chooseStatus = (s: Status | null) => {
    if (!viewer) return router.push(loginHref());
    if (
      s === null &&
      !window.confirm(
        "Remover da estante? As datas e o histórico de leitura deste livro serão apagados. Sua resenha continua.",
      )
    )
      return;
    if (s === "READ") return setModal("finish");
    if (s === "ABANDONED") return setModal("abandon");
    run(
      () => {
        patch({ status: s });
        return setShelfStatus(book.id, s);
      },
      s === null ? () => toast("Livro removido da sua estante.") : undefined,
      toast,
    );
  };

  const categories = categoryLabels(book.categories);
  const facts: ReactNode[] = [
    book.pageCount ? `${book.pageCount} páginas` : null,
    data.languageLabel,
    book.publisher ? (
      <Link
        href={publisherHref(book.publisher)}
        className="hover:text-(--ink) hover:underline underline-offset-2"
      >
        {book.publisher}
      </Link>
    ) : null,
    book.publishedDate?.slice(0, 4),
  ].filter(Boolean);

  const showGoogle = rating.count === 0 && book.googleRating != null;
  const average = showGoogle ? book.googleRating! : rating.average;
  const current = STATUSES.find((s) => s.id === opt.status);
  const canReread = viewer
    ? viewer.timesRead > (viewer.reading ? 1 : 0)
    : false;

  return (
    <section
      className="grid gap-8 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] md:gap-10 lg:gap-14 items-start"
      data-screen-label="01 Book hero"
    >
      <div className="w-50 mx-auto md:w-full">
        <BookCover
          book={book.cover}
          size="lg"
          loading="eager"
          sizes="(max-width: 768px) 200px, 280px"
          style={{
            width: "100%",
            aspectRatio: "2/3",
            borderRadius: 6,
            boxShadow:
              "0 30px 50px -28px rgba(67,62,18,0.55), 0 8px 16px -8px rgba(67,62,18,0.25)",
            padding: "24px 20px",
          }}
        />
      </div>

      <div className="flex flex-col min-w-0">
        <h1 className="m-0 text-[34px] md:text-[42px] lg:text-[50px] font-extrabold tracking-[-0.025em] leading-[1.02] text-(--ink) text-balance">
          {book.title}
        </h1>
        {book.subtitle && (
          <p className="m-0 mt-2 text-[17px] text-(--ink-3) leading-snug">
            {book.subtitle}
          </p>
        )}
        <div className="mt-3 text-[17px] text-(--ink-3)">
          por{" "}
          {book.authors.length ? (
            book.authors.map((a, i) => (
              <span key={a}>
                {i > 0 && ", "}
                <Link
                  href={authorHref(a)}
                  className="text-(--ink-2) font-medium border-b border-(--ink-5) pb-px hover:border-(--ink-2)"
                >
                  {a}
                </Link>
              </span>
            ))
          ) : (
            <span className="text-(--ink-2) font-medium">
              Autor desconhecido
            </span>
          )}
        </div>

        {average > 0 && (
          <a
            href="#avaliacoes"
            className="mt-4 self-start flex items-center gap-2.5 group"
          >
            <span className="text-[22px] font-extrabold text-(--ink) tracking-[-0.02em] leading-none">
              {average.toFixed(1).replace(".", ",")}
            </span>
            <Stars value={average} className="text-[16px]" />
            <span className="text-[12px] text-(--ink-4) group-hover:text-(--ink-2)">
              {showGoogle
                ? `${(book.googleRatingsCount ?? 0).toLocaleString("pt-BR")} no Google Books`
                : `${rating.count.toLocaleString("pt-BR")} ${rating.count === 1 ? "avaliação" : "avaliações"}`}
            </span>
          </a>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {current ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={pending}
                className="h-10 pl-3.5 pr-3 rounded-[10px] bg-(--ink-2) text-(--yellow) text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer outline-none disabled:cursor-wait"
              >
                {pending ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" strokeWidth={2.6} />
                )}
                {current.label}
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <StatusMenu
                current={current.id}
                onChoose={chooseStatus}
                onReadAgain={() => setModal("finish")}
                canReread={canReread}
                allowRemove
              />
            </DropdownMenu>
          ) : (
            <div className="inline-flex h-10 rounded-[10px] bg-(--yellow) border border-(--yellow-deep) text-(--ink) overflow-hidden">
              <button
                type="button"
                disabled={pending}
                className="pl-4 pr-3.5 text-[13px] font-semibold cursor-pointer hover:bg-(--yellow-deep) disabled:cursor-wait inline-flex items-center gap-2"
                onClick={() => chooseStatus("WANT")}
              >
                {pending && (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                )}
                Quero ler
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={pending}
                  aria-label="Outros status de leitura"
                  className="px-2.5 border-l border-(--yellow-deep) cursor-pointer outline-none hover:bg-(--yellow-deep) disabled:cursor-wait"
                >
                  <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <StatusMenu
                  current="WANT"
                  onChoose={chooseStatus}
                  canReread={canReread}
                />
              </DropdownMenu>
            </div>
          )}

          <button
            type="button"
            className={`${iconButton} ${iconButtonState(opt.liked)}`}
            disabled={pending}
            aria-pressed={opt.liked}
            aria-label={opt.liked ? "Descurtir" : "Curtir"}
            title={opt.liked ? "Curtido" : "Curtir"}
            onClick={guard(() =>
              run(
                () => {
                  patch({ liked: !opt.liked });
                  return toggleBookLike(book.id);
                },
                undefined,
                toast,
              ),
            )}
          >
            <Heart
              className="w-4 h-4"
              fill={opt.liked ? "currentColor" : "none"}
            />
          </button>
          <button
            type="button"
            className={`${iconButton} ${iconButtonState(opt.favorite)}`}
            disabled={pending}
            aria-pressed={opt.favorite}
            aria-label={
              opt.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
            }
            title={opt.favorite ? "Nos favoritos" : "Adicionar aos favoritos"}
            onClick={guard(() =>
              run(
                () => {
                  patch({ favorite: !opt.favorite });
                  return toggleFavorite(book.id);
                },
                undefined,
                toast,
              ),
            )}
          >
            <Star
              className="w-4 h-4"
              fill={opt.favorite ? "currentColor" : "none"}
            />
          </button>
          <button
            type="button"
            className={`${iconButton} ${iconButtonState(false)}`}
            aria-label="Adicionar a uma lista"
            title="Adicionar a uma lista"
            onClick={guard(() => setModal("lists"))}
          >
            <ListPlus className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={`${iconButton} ${iconButtonState(false)}`}
            aria-label="Compartilhar"
            title="Compartilhar"
            onClick={() => shareLink(`/book/${book.id}`, book.title)}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {viewer && viewer.otherEditions.length > 0 && (
          <div className="mt-4 text-[13px] text-(--ink-3) bg-(--yellow-soft) border border-(--yellow-deep) rounded-[10px] py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-between">
            <span>
              Você tem outra edição deste livro na estante:{" "}
              {viewer.otherEditions.map((o, i) => (
                <span key={o.id}>
                  {i > 0 && ", "}
                  <Link
                    href={`/book/${o.id}`}
                    className="font-semibold text-(--ink-2) border-b border-(--ink-4) hover:border-(--ink-2)"
                  >
                    {STATUSES.find((x) => x.id === o.status)?.label ??
                      "Na estante"}
                    {o.label ? ` · ${o.label}` : ""}
                  </Link>
                </span>
              ))}
            </span>
            {!viewer.status && viewer.otherEditions.length === 1 && (
              <button
                type="button"
                disabled={pending}
                className="shrink-0 self-start sm:self-auto h-8 px-3 rounded-lg bg-(--ink-2) text-(--yellow) text-[12px] font-semibold cursor-pointer disabled:cursor-wait"
                onClick={() => {
                  if (
                    !window.confirm(
                      "Usar esta edição? Seu status, suas leituras, sua resenha e as listas passam pra ela.",
                    )
                  )
                    return;
                  run(
                    () => switchEdition(viewer.otherEditions[0].id, book.id),
                    () => toast("Agora esta é a sua edição."),
                    toast,
                  );
                }}
              >
                Usar esta edição
              </button>
            )}
          </div>
        )}

        {(facts.length > 0 || categories.length > 0) && (
          <div className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[13px] text-(--ink-3)">
            {facts.map((f, i) => (
              <span key={i} className="flex items-center gap-2.5">
                {i > 0 && <span className="text-(--ink-5)">·</span>}
                {f}
              </span>
            ))}
            {categories.map((c) => (
              <span
                key={c}
                className="text-[11px] font-medium bg-(--yellow-soft) text-(--ink-2) border border-(--yellow-deep) py-0.5 px-2 rounded-md"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {book.description && (
          <div className="mt-6 pt-6 border-t border-(--rule)">
            <Synopsis description={book.description} />
          </div>
        )}
      </div>

      {viewer && modal === "finish" && (
        <FinishModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          bookId={book.id}
          title={book.title}
          today={today}
          startedAt={viewer.reading?.startedPartial}
          onFinished={() => {
            if (!viewer.review) setModal("review");
          }}
        />
      )}
      {viewer && modal === "abandon" && (
        <AbandonModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          bookId={book.id}
          title={book.title}
          currentPage={viewer.currentPage}
          pageCount={book.pageCount}
        />
      )}
      {viewer && modal === "review" && (
        <ReviewModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          bookId={book.id}
          title={book.title}
          eyebrow="Leitura concluída · que tal uma resenha?"
        />
      )}
      {viewer && modal === "lists" && (
        <AddToListModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          bookId={book.id}
          title={book.title}
          lists={viewer.lists}
        />
      )}
    </section>
  );
}

function StatusMenu({
  current,
  onChoose,
  onReadAgain,
  allowRemove,
  canReread,
}: {
  current?: Status;
  onChoose: (s: Status | null) => void;
  onReadAgain?: () => void;
  allowRemove?: boolean;
  canReread: boolean;
}) {
  return (
    <DropdownMenuContent
      align="start"
      className="w-auto min-w-48 p-1.5 rounded-[12px] bg-(--cream) border border-[rgba(67,62,18,0.10)] shadow-[0_16px_40px_-8px_rgba(67,62,18,0.22),0_2px_8px_-2px_rgba(67,62,18,0.10)]"
    >
      {current === "READ" && onReadAgain && (
        <>
          <DropdownMenuItem className={menuItem} onClick={onReadAgain}>
            <RotateCcw className="w-3.5 h-3.5" />
            Li de novo
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[rgba(67,62,18,0.08)] -mx-1.5 my-1" />
        </>
      )}
      {STATUSES.filter(
        (s) => s.id !== current && (canReread || s.id !== "REREADING"),
      ).map((s) => (
        <DropdownMenuItem
          key={s.id}
          className={menuItem}
          onClick={() => onChoose(s.id)}
        >
          {s.label}
        </DropdownMenuItem>
      ))}
      {allowRemove && (
        <>
          <DropdownMenuSeparator className="bg-[rgba(67,62,18,0.08)] -mx-1.5 my-1" />
          <DropdownMenuItem className={menuItem} onClick={() => onChoose(null)}>
            <X className="w-3.5 h-3.5" />
            Remover da estante
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );
}
