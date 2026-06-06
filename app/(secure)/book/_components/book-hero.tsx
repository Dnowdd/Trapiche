"use client";

import { useState } from "react";
import { BOOK_DETAIL } from "../mock-book";
import BookCover from "@/components/shared/book-cover";

const BookHero = () => {
  const [status, setStatus] = useState(BOOK_DETAIL.user.status);
  const [liked, setLiked] = useState(BOOK_DETAIL.user.liked);
  const [fav, setFav] = useState(BOOK_DETAIL.user.favorite);

  const STATUSES = [
    { id: "lendo", label: "Lendo" },
    { id: "quero", label: "Quero ler" },
    { id: "lido", label: "Lido" },
    { id: "abandonei", label: "Abandonei" },
    { id: "relendo", label: "Relendo" },
  ];

  return (
    <section className="grid grid-cols-[320px_1fr] gap-15 items-start" data-screen-label="01 Book hero">
      <div className="relative [&_.cover-pub]:text-[11px] [&_.cover-title]:text-[28px] [&_.cover-author]:text-[12px] [&_.cover-author]:tracking-[0.06em]">
        <BookCover
          book={BOOK_DETAIL}
          size="lg"
          style={{
            width: 320,
            height: 480,
            borderRadius: 6,
            boxShadow: "0 30px 50px -28px rgba(67,62,18,0.55), 0 8px 16px -8px rgba(67,62,18,0.25)",
            padding: "26px 22px",
          }}
        />
        <div className="mt-2.5 font-mono text-[10px] text-(--ink-4) tracking-[0.04em] text-center">{BOOK_DETAIL.cover_credit}</div>
      </div>

      <div className="flex flex-col">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase flex gap-2.5 items-center">
          <span>{BOOK_DETAIL.subtitle}</span>
          <span className="text-(--ink-5)">·</span>
          <span>{BOOK_DETAIL.edition}</span>
          <span className="text-(--ink-5)">·</span>
          <span>{BOOK_DETAIL.meta.year}</span>
        </div>

        <h1 className="mt-3 mb-2 text-[52px] font-extrabold tracking-[-0.025em] leading-[1] text-(--ink) [text-wrap:balance] max-w-[700px]">{BOOK_DETAIL.title}</h1>
        <div className="text-[18px] text-(--ink-3) mb-3.5">
          por <a href="#" className="text-(--ink-2) border-b border-(--ink-4) pb-px hover:border-(--ink-2)">{BOOK_DETAIL.author}</a>
        </div>

        <div className="flex items-center gap-5.5 mt-2 mb-5.5">
          <div className="text-[44px] font-extrabold text-(--ink) tracking-[-0.025em] leading-[1] flex items-baseline gap-1">
            {BOOK_DETAIL.rating.average}
            <span className="text-[14px] font-medium text-(--ink-4) tracking-normal font-mono">/ 5</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-[18px] text-(--ink-2) tracking-[-1px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={i < Math.round(BOOK_DETAIL.rating.average) ? "" : "text-[rgba(67,62,18,0.18)]"}>★</span>
              ))}
            </div>
            <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.04em]">
              {BOOK_DETAIL.rating.count.toLocaleString("pt-BR")} avaliações no Trapiche
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              className="text-[12px] font-medium py-2.5 px-4 rounded-lg border border-[rgba(67,62,18,0.15)] bg-transparent text-(--ink-3) inline-flex items-center gap-2 cursor-pointer transition-[background,color,border-color] duration-120 hover:bg-(--yellow-soft) hover:text-(--ink-2) aria-pressed:bg-(--ink-2) aria-pressed:text-(--yellow) aria-pressed:border-(--ink-2)"
              aria-pressed={status === s.id}
              onClick={() => setStatus(s.id)}
            >
              {status === s.id && (
                <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg>
              )}
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2.5 mb-6">
          <button
            className={`inline-flex items-center gap-1.5 text-[12px] font-medium py-2 px-3.5 rounded-lg border border-[rgba(67,62,18,0.15)] cursor-pointer transition-[color,background] duration-120 hover:text-(--ink-2) hover:bg-(--yellow-soft) ${liked ? "text-(--ink) bg-(--yellow) border-(--yellow-deep)" : "bg-(--cream-card) text-(--ink-3)"}`}
            onClick={() => setLiked(!liked)}
          >
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-4.35-9.5-9C.6 7.5 3 4 6.5 4c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 5.9 3.5 4 8-2.5 4.65-9.5 9-9.5 9z" />
            </svg>
            {liked ? "Curtido" : "Curtir"}
          </button>
          <button
            className={`inline-flex items-center gap-1.5 text-[12px] font-medium py-2 px-3.5 rounded-lg border border-[rgba(67,62,18,0.15)] cursor-pointer transition-[color,background] duration-120 hover:text-(--ink-2) hover:bg-(--yellow-soft) ${fav ? "text-(--ink) bg-(--yellow) border-(--yellow-deep)" : "bg-(--cream-card) text-(--ink-3)"}`}
            onClick={() => setFav(!fav)}
          >
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.5 2.5l2.5 6 6.5.5-5 4.5 1.5 6.5-5.5-3.5L6 20l1.5-6.5L2.5 9l6.5-.5z" />
            </svg>
            {fav ? "Nos favoritos" : "Adicionar aos favoritos"}
          </button>
          <button className="inline-flex items-center gap-1.5 text-[12px] font-medium py-2 px-3.5 rounded-lg border border-[rgba(67,62,18,0.15)] bg-(--cream-card) text-(--ink-3) cursor-pointer transition-[color,background] duration-120 hover:text-(--ink-2) hover:bg-(--yellow-soft)">
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Adicionar a uma lista
          </button>
          <button className="inline-flex items-center gap-1.5 text-[12px] font-medium py-2 px-3.5 rounded-lg border border-[rgba(67,62,18,0.15)] bg-(--cream-card) text-(--ink-3) cursor-pointer transition-[color,background] duration-120 hover:text-(--ink-2) hover:bg-(--yellow-soft)">
            <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
            Compartilhar
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6 py-5.5 border-y border-(--rule)">
          <div>
            <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Páginas</div>
            <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.pages}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Idioma</div>
            <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.language}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Editora</div>
            <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.publisher}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">ISBN-13</div>
            <div className="font-mono text-[13px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.isbn13}</div>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap mt-4">
          {BOOK_DETAIL.meta.categories.map((c) => (
            <span key={c} className="font-mono text-[10px] bg-(--yellow-soft) text-(--ink-2) border border-(--yellow-deep) py-1 px-[9px] rounded tracking-[0.04em] uppercase">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookHero;
