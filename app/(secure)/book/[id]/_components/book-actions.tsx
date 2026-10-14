"use client";

import { useState } from "react";

const STATUSES = [
  { id: "quero", label: "Quero ler" },
  { id: "lendo", label: "Lendo" },
  { id: "lido", label: "Lido" },
  { id: "relendo", label: "Relendo" },
  { id: "abandonei", label: "Abandonei" },
];

export default function BookActions() {
  const [status, setStatus] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [fav, setFav] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Status buttons */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            className="text-[12px] font-medium py-2.5 px-4 rounded-lg border border-[rgba(67,62,18,0.15)] bg-transparent text-(--ink-3) inline-flex items-center gap-2 cursor-pointer transition-[background,color,border-color] duration-120 hover:bg-(--yellow-soft) hover:text-(--ink-2) aria-pressed:bg-(--ink-2) aria-pressed:text-(--yellow) aria-pressed:border-(--ink-2)"
            aria-pressed={status === s.id}
            onClick={() => setStatus(status === s.id ? null : s.id)}
          >
            {status === s.id && (
              <svg
                className="w-[13px] h-[13px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12l5 5L20 6" />
              </svg>
            )}
            {s.label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2.5">
        <button
          className={`inline-flex items-center gap-1.5 text-[12px] font-medium py-2 px-3.5 rounded-lg border cursor-pointer transition-[color,background] duration-120 hover:text-(--ink-2) hover:bg-(--yellow-soft) ${
            liked
              ? "text-(--ink) bg-(--yellow) border-(--yellow-deep)"
              : "border-[rgba(67,62,18,0.15)] bg-(--cream-card) text-(--ink-3)"
          }`}
          onClick={() => setLiked(!liked)}
        >
          <svg
            className="w-[13px] h-[13px]"
            viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 21s-7-4.35-9.5-9C.6 7.5 3 4 6.5 4c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 5.9 3.5 4 8-2.5 4.65-9.5 9-9.5 9z" />
          </svg>
          {liked ? "Curtido" : "Curtir"}
        </button>

        <button
          className={`inline-flex items-center gap-1.5 text-[12px] font-medium py-2 px-3.5 rounded-lg border cursor-pointer transition-[color,background] duration-120 hover:text-(--ink-2) hover:bg-(--yellow-soft) ${
            fav
              ? "text-(--ink) bg-(--yellow) border-(--yellow-deep)"
              : "border-[rgba(67,62,18,0.15)] bg-(--cream-card) text-(--ink-3)"
          }`}
          onClick={() => setFav(!fav)}
        >
          <svg
            className="w-[13px] h-[13px]"
            viewBox="0 0 24 24"
            fill={fav ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11.5 2.5l2.5 6 6.5.5-5 4.5 1.5 6.5-5.5-3.5L6 20l1.5-6.5L2.5 9l6.5-.5z" />
          </svg>
          {fav ? "Nos favoritos" : "Adicionar aos favoritos"}
        </button>

        <button className="inline-flex items-center gap-1.5 text-[12px] font-medium py-2 px-3.5 rounded-lg border border-[rgba(67,62,18,0.15)] bg-(--cream-card) text-(--ink-3) cursor-pointer transition-[color,background] duration-120 hover:text-(--ink-2) hover:bg-(--yellow-soft)">
          <svg
            className="w-[13px] h-[13px]"
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

        <button className="inline-flex items-center gap-1.5 text-[12px] font-medium py-2 px-3.5 rounded-lg border border-[rgba(67,62,18,0.15)] bg-(--cream-card) text-(--ink-3) cursor-pointer transition-[color,background] duration-120 hover:text-(--ink-2) hover:bg-(--yellow-soft)">
          <svg
            className="w-[13px] h-[13px]"
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
    </div>
  );
}
