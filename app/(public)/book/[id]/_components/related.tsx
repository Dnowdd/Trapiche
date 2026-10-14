"use client";

import { useState } from "react";
import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import type { Book } from "@/lib/types/book";

export default function Related({ books }: { books: Book[] }) {
  const [expanded, setExpanded] = useState(false);
  if (books.length === 0) return null;
  const shown = expanded ? books : books.slice(0, 5);

  return (
    <section className="mt-14" data-screen-label="08 Relacionados">
      <div className="flex items-end justify-between mb-5.5">
        <div>
          <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
            Leituras vizinhas
          </div>
          <h2 className="m-0 text-[24px] font-bold tracking-[-0.015em] text-(--ink)">
            Quem leu esse, leu também
          </h2>
        </div>
        {books.length > 5 && (
          <button
            type="button"
            className="text-[12px] text-(--ink-3) border-b border-(--ink-4) cursor-pointer hover:text-(--ink)"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Ver menos ↑" : "Ver mais →"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-5 gap-4.5 gap-y-7">
        {shown.map((b) => (
          <Link
            href={`/book/${b.id}`}
            className="flex flex-col gap-2 transition-transform duration-120 hover:-translate-y-0.5"
            key={b.id}
          >
            <BookCover
              book={b}
              size="md"
              style={{ width: "100%", aspectRatio: "2/3" }}
            />
            <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight">
              {b.title}
            </div>
            <div className="text-[11px] text-(--ink-4)">{b.author}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
