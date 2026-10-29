"use client";

import { useState } from "react";
import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import type { BookPageData, EditionItem } from "@/lib/queries/book";
import { SectionHeader } from "./section-header";

const PREVIEW = 6;

function EditionCard({
  edition,
  current,
}: {
  edition: EditionItem;
  current?: boolean;
}) {
  const meta = [edition.year, edition.pages ? `${edition.pages} pág.` : null]
    .filter(Boolean)
    .join(" · ");
  const body = (
    <>
      <div className="relative">
        <BookCover
          book={edition.cover}
          size="sm"
          style={{ width: "100%", aspectRatio: "2/3" }}
        />
        {current && (
          <span className="absolute top-1.5 left-1.5 font-mono text-[8px] tracking-[0.06em] uppercase bg-(--yellow) text-(--ink) px-1 py-0.5 rounded-[3px]">
            Esta edição
          </span>
        )}
      </div>
      <div className="text-[12px] font-semibold text-(--ink-2) leading-tight line-clamp-2">
        {edition.publisher}
      </div>
      {meta && <div className="text-[10px] text-(--ink-4) -mt-1">{meta}</div>}
    </>
  );

  const className = "flex flex-col gap-1.5";
  if (current) return <div className={className}>{body}</div>;
  return (
    <Link
      href={`/book/${edition.cover.id}`}
      className={`${className} transition-transform duration-120 hover:-translate-y-0.5`}
    >
      {body}
    </Link>
  );
}

export default function Editions({
  book,
  languageLabel,
  editions,
}: {
  book: BookPageData["book"];
  languageLabel: string | null;
  editions: EditionItem[];
}) {
  const [expanded, setExpanded] = useState(false);
  if (editions.length === 0) return null;

  const current: EditionItem = {
    cover: book.cover,
    publisher: book.publisher,
    year: book.publishedDate?.slice(0, 4) ?? null,
    pages: book.pageCount,
    language: languageLabel,
    fromGoogle: false,
  };
  const all = [current, ...editions];

  return (
    <section
      id="edicoes"
      className="min-w-0 scroll-mt-6"
      data-screen-label="Edições"
    >
      <SectionHeader
        eyebrow="Edições"
        title={`${all.length} edições`}
        small
        action={
          all.length > PREVIEW ? (
            <button
              type="button"
              className="hidden lg:inline text-[12px] text-(--ink-3) border-b border-(--ink-4) cursor-pointer hover:text-(--ink)"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Ver menos" : `Ver todas (${all.length})`}
            </button>
          ) : null
        }
      />
      {editions.some((e) => e.fromGoogle) && (
        <div className="-mt-2 mb-3 flex items-center gap-2 text-[11px] text-(--ink-4)">
          Algumas edições via
          {/* eslint-disable-next-line @next/next/no-img-element -- Google's branding rules require the unaltered official badge. */}
          <img
            src="/powered-by-google.png"
            alt="Powered by Google"
            width={62}
            height={30}
            className="h-4 w-auto"
          />
        </div>
      )}
      <div className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory overscroll-x-contain -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-3 lg:gap-x-3 lg:gap-y-4 lg:overflow-visible lg:mx-0 lg:px-0">
        {all.map((e, i) => (
          <div
            key={e.cover.id}
            className={[
              "w-28 shrink-0 snap-start lg:w-auto",
              !expanded && i >= PREVIEW ? "lg:hidden" : "",
            ].join(" ")}
          >
            <EditionCard edition={e} current={i === 0} />
          </div>
        ))}
      </div>
    </section>
  );
}
