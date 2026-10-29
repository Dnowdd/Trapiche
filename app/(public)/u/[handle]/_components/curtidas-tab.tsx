"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Chips from "@/components/shared/chips";
import BookCover from "@/components/shared/book-cover";
import type { getCurtidas } from "@/lib/queries/profile";

type Item = Awaited<ReturnType<typeof getCurtidas>>[number];

export default function CurtidasTab({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState("todos");
  const thisYear = new Date().getFullYear();
  const years = [...new Set(items.map((i) => i.year))].sort((a, b) => b - a);
  const shown =
    filter === "todos" ? items : items.filter((i) => String(i.year) === filter);

  return (
    <>
      <Chips
        label="Curti em"
        value={filter}
        onChange={setFilter}
        options={[
          { id: "todos", label: "Tudo", count: items.length },
          ...years.map((y) => ({
            id: String(y),
            label: y === thisYear ? "Este ano" : String(y),
            count: items.filter((i) => i.year === y).length,
          })),
        ]}
      />
      {shown.length === 0 ? (
        <p className="m-0 text-[14px] text-(--ink-4)">
          Nenhum livro curtido ainda.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4.5 gap-y-6 sm:gap-y-7">
          {shown.map((it) => (
            <Link
              href={`/book/${it.book.id}`}
              className="flex flex-col gap-2 transition-transform duration-120 relative hover:-translate-y-0.5"
              key={it.book.id}
            >
              <div className="relative">
                <BookCover
                  book={it.book}
                  size="md"
                  style={{ width: "100%", aspectRatio: "2/3" }}
                />
                <div
                  className="absolute top-2 right-2 w-6.5 h-6.5 bg-[rgba(0,0,0,0.55)] backdrop-blur-[6px] rounded-full flex items-center justify-center text-[#ffe767] z-2"
                  aria-label="curtido"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 21s-7-4.35-9.5-9C.6 7.5 3 4 6.5 4c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 5.9 3.5 4 8-2.5 4.65-9.5 9-9.5 9z" />
                  </svg>
                </div>
              </div>
              <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight">
                {it.book.title}
              </div>
              <div className="text-[11px] text-(--ink-4) -mt-0.75">
                {it.book.author}
              </div>
              <div className="font-mono text-[10px] text-(--ink-5) tracking-[0.04em] mt-0.5 flex items-center gap-1">
                <Heart className="w-3 h-3" /> {it.when}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
