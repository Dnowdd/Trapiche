"use client";

import { useState } from "react";
import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import type { Book } from "@/lib/types/book";
import { SectionHeader } from "./section-header";

const PREVIEW = 6;

export default function Related({ books }: { books: Book[] }) {
  const [expanded, setExpanded] = useState(false);
  if (books.length === 0) return null;
  const shown = expanded ? books : books.slice(0, PREVIEW);

  return (
    <section data-screen-label="08 Relacionados">
      <SectionHeader
        eyebrow="Leituras vizinhas"
        title="Quem leu esse, leu também"
        action={
          books.length > PREVIEW ? (
            <button
              type="button"
              className="text-[12px] text-(--ink-3) border-b border-(--ink-4) cursor-pointer hover:text-(--ink)"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Ver menos" : "Ver mais"}
            </button>
          ) : null
        }
      />
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 gap-y-6">
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
