"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BookCover from "@/components/shared/book-cover";
import type { BookPageData } from "@/lib/queries/book";
import { SectionHeader } from "./section-header";

const arrow =
  "w-9 h-9 rounded-full border border-[rgba(67,62,18,0.16)] bg-(--cream-card) text-(--ink-2) flex items-center justify-center cursor-pointer transition-[background,opacity] duration-150 hover:bg-(--yellow-soft) disabled:opacity-35 disabled:cursor-default disabled:hover:bg-(--cream-card)";

export default function ByAuthor({ data }: { data: BookPageData["byAuthor"] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = () => {
    const el = track.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!data) return null;

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el)
      el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section
      id="mais-do-autor"
      className="scroll-mt-6"
      data-screen-label="Mais do autor"
    >
      <SectionHeader
        eyebrow="Mesmo autor"
        title={`Mais de ${data.author}`}
        action={
          <div
            className={
              edges.start && edges.end ? "hidden" : "hidden md:flex gap-2"
            }
          >
            <button
              type="button"
              className={arrow}
              aria-label="Anteriores"
              disabled={edges.start}
              onClick={() => scroll(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={arrow}
              aria-label="Próximos"
              disabled={edges.end}
              onClick={() => scroll(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        }
      />
      <div
        ref={track}
        onScroll={update}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {data.items.map(({ cover, year }) => (
          <Link
            href={`/book/${cover.id}`}
            key={cover.id}
            className="w-32 sm:w-36 lg:w-[calc((100%-5*1rem)/6)] shrink-0 snap-start flex flex-col gap-2 transition-transform duration-120 hover:-translate-y-0.5"
          >
            <BookCover
              book={cover}
              size="md"
              sizes="(max-width: 640px) 128px, 180px"
              style={{ width: "100%", aspectRatio: "2/3" }}
            />
            <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight line-clamp-2">
              {cover.title}
            </div>
            {year && (
              <div className="text-[11px] text-(--ink-4) -mt-1">{year}</div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
