"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BookCover from "@/components/shared/book-cover";
import { toast } from "@/components/shared/toast";
import FinishModal from "@/components/reading/finish-modal";
import AbandonModal from "@/components/reading/abandon-modal";
import ReviewModal from "@/components/reading/review-modal";
import AddToListModal from "@/components/lists/add-to-list-modal";
import { useAction } from "@/components/reading/use-action";
import { shareLink } from "@/components/reading/share";
import {
  setShelfStatus,
  toggleBookLike,
  toggleFavorite,
} from "@/lib/actions/shelf";
import type { BookPageData } from "@/lib/queries/book";
import { categoryLabels } from "@/lib/categories";
import Stars from "./stars";

type Status = "READING" | "WANT" | "READ" | "ABANDONED" | "REREADING";

const STATUSES: { id: Status; label: string }[] = [
  { id: "READING", label: "Lendo" },
  { id: "WANT", label: "Quero ler" },
  { id: "READ", label: "Lido" },
  { id: "ABANDONED", label: "Abandonei" },
  { id: "REREADING", label: "Relendo" },
];

const pill =
  "inline-flex items-center gap-1.5 text-[12px] font-medium py-2 px-3.5 rounded-lg border cursor-pointer transition-[color,background] duration-120 hover:text-(--ink-2) hover:bg-(--yellow-soft) disabled:cursor-wait";

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
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);
  const { pending, run } = useAction();

  const guard = (fn: () => void) => () => {
    if (!loggedIn) {
      router.push("/auth");
      return;
    }
    fn();
  };

  const onError = (message: string) => {
    setPendingStatus(null);
    toast(message);
  };

  const chooseStatus = (s: Status) => {
    if (!viewer) return;
    if (viewer.status === s) {
      setPendingStatus(s);
      run(
        () => setShelfStatus(book.id, null),
        () => {
          setPendingStatus(null);
          toast("Livro removido da sua estante.");
        },
        onError,
      );
      return;
    }
    if (s === "READ") return setModal("finish");
    if (s === "ABANDONED") return setModal("abandon");
    setPendingStatus(s);
    run(
      () => setShelfStatus(book.id, s),
      () => setPendingStatus(null),
      onError,
    );
  };

  const categories = categoryLabels(book.categories);
  const meta = [
    categories[0],
    book.publisher,
    book.publishedDate?.slice(0, 4),
  ].filter(Boolean);

  const showGoogle = rating.count === 0 && book.googleRating != null;
  const average = showGoogle ? book.googleRating! : rating.average;

  return (
    <section
      className="grid grid-cols-[320px_1fr] gap-15 items-start"
      data-screen-label="01 Book hero"
    >
      <div className="relative [&_.cover-pub]:text-[11px] [&_.cover-title]:text-[28px] [&_.cover-author]:text-[12px] [&_.cover-author]:tracking-[0.06em]">
        <BookCover
          book={book.cover}
          size="lg"
          loading="eager"
          style={{
            width: 320,
            height: 480,
            borderRadius: 6,
            boxShadow:
              "0 30px 50px -28px rgba(67,62,18,0.55), 0 8px 16px -8px rgba(67,62,18,0.25)",
            padding: "26px 22px",
          }}
        />
      </div>

      <div className="flex flex-col">
        {meta.length > 0 && (
          <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase flex gap-2.5 items-center flex-wrap">
            {meta.map((m, i) => (
              <span key={i} className="flex gap-2.5 items-center">
                {i > 0 && <span className="text-(--ink-5)">·</span>}
                <span>{m}</span>
              </span>
            ))}
          </div>
        )}

        <h1 className="mt-3 mb-2 text-[52px] font-extrabold tracking-[-0.025em] leading-none text-(--ink) text-balance max-w-175">
          {book.title}
        </h1>
        {book.subtitle && (
          <p className="m-0 mb-2 text-[18px] text-(--ink-3) leading-snug">
            {book.subtitle}
          </p>
        )}
        <div className="text-[18px] text-(--ink-3) mb-3.5">
          por{" "}
          {data.byAuthor ? (
            <a
              href="#mais-do-autor"
              className="text-(--ink-2) border-b border-(--ink-4) pb-px hover:border-(--ink-2)"
            >
              {book.authors.join(", ")}
            </a>
          ) : (
            <span className="text-(--ink-2)">
              {book.authors.join(", ") || "Autor desconhecido"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-5.5 mt-2 mb-5.5">
          {average > 0 ? (
            <>
              <div className="text-[44px] font-extrabold text-(--ink) tracking-[-0.025em] leading-none flex items-baseline gap-1">
                {average.toFixed(1).replace(".", ",")}
                <span className="text-[14px] font-medium text-(--ink-4) tracking-normal font-mono">
                  / 5
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <Stars value={average} className="text-[18px]" />
                <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.04em]">
                  {showGoogle
                    ? `${(book.googleRatingsCount ?? 0).toLocaleString("pt-BR")} avaliações no Google Books`
                    : `${rating.count.toLocaleString("pt-BR")} ${rating.count === 1 ? "avaliação" : "avaliações"} no Trapiche`}
                </div>
              </div>
            </>
          ) : (
            <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.04em]">
              Ainda sem avaliações no Trapiche
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUSES.map((s) => {
            const active = viewer?.status === s.id;
            const busy = pending && pendingStatus === s.id;
            return (
              <button
                key={s.id}
                className="text-[12px] font-medium py-2.5 px-4 rounded-lg border border-[rgba(67,62,18,0.15)] bg-transparent text-(--ink-3) inline-flex items-center gap-2 cursor-pointer transition-[background,color,border-color] duration-120 hover:bg-(--yellow-soft) hover:text-(--ink-2) aria-pressed:bg-(--ink-2) aria-pressed:text-(--yellow) aria-pressed:border-(--ink-2) disabled:cursor-wait"
                aria-pressed={active}
                disabled={pending}
                title={active ? "Clique para tirar da estante" : undefined}
                onClick={guard(() => chooseStatus(s.id))}
              >
                {busy ? (
                  <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  active && (
                    <svg
                      className="w-3.25 h-3.25"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                  )
                )}
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2.5 mb-6 flex-wrap">
          <button
            className={`${pill} ${viewer?.liked ? "text-(--ink) bg-(--yellow) border-(--yellow-deep)" : "border-[rgba(67,62,18,0.15)] bg-(--cream-card) text-(--ink-3)"}`}
            disabled={pending}
            aria-pressed={viewer?.liked ?? false}
            onClick={guard(() =>
              run(() => toggleBookLike(book.id), undefined, toast),
            )}
          >
            <svg
              className="w-3.25 h-3.25"
              viewBox="0 0 24 24"
              fill={viewer?.liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21s-7-4.35-9.5-9C.6 7.5 3 4 6.5 4c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 5.9 3.5 4 8-2.5 4.65-9.5 9-9.5 9z" />
            </svg>
            {viewer?.liked ? "Curtido" : "Curtir"}
          </button>
          <button
            className={`${pill} ${viewer?.favorite ? "text-(--ink) bg-(--yellow) border-(--yellow-deep)" : "border-[rgba(67,62,18,0.15)] bg-(--cream-card) text-(--ink-3)"}`}
            disabled={pending}
            aria-pressed={viewer?.favorite ?? false}
            onClick={guard(() =>
              run(() => toggleFavorite(book.id), undefined, toast),
            )}
          >
            <svg
              className="w-3.25 h-3.25"
              viewBox="0 0 24 24"
              fill={viewer?.favorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11.5 2.5l2.5 6 6.5.5-5 4.5 1.5 6.5-5.5-3.5L6 20l1.5-6.5L2.5 9l6.5-.5z" />
            </svg>
            {viewer?.favorite ? "Nos favoritos" : "Adicionar aos favoritos"}
          </button>
          <button
            className={`${pill} border-[rgba(67,62,18,0.15)] bg-(--cream-card) text-(--ink-3)`}
            onClick={guard(() => setModal("lists"))}
          >
            <svg
              className="w-3.25 h-3.25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Adicionar a uma lista
          </button>
          <button
            className={`${pill} border-[rgba(67,62,18,0.15)] bg-(--cream-card) text-(--ink-3)`}
            onClick={() => shareLink(`/book/${book.id}`, book.title)}
          >
            <svg
              className="w-3.25 h-3.25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
            Compartilhar
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6 py-5.5 border-y border-(--rule)">
          {[
            { label: "Páginas", value: book.pageCount },
            { label: "Idioma", value: data.languageLabel },
            { label: "Editora", value: book.publisher },
            { label: "ISBN-13", value: book.isbn13, mono: true },
          ].map((m) => (
            <div key={m.label}>
              <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
                {m.label}
              </div>
              <div
                className={
                  m.mono
                    ? "font-mono text-[13px] text-(--ink-2) font-medium"
                    : "text-[14px] text-(--ink-2) font-medium"
                }
              >
                {m.value ?? "—"}
              </div>
            </div>
          ))}
        </div>

        {categories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-4">
            {categories.map((c) => (
              <span
                key={c}
                className="font-mono text-[10px] bg-(--yellow-soft) text-(--ink-2) border border-(--yellow-deep) py-1 px-2.25 rounded tracking-[0.04em] uppercase"
              >
                {c}
              </span>
            ))}
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
          startedAt={viewer.reading?.startedISO}
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
