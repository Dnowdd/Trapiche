"use client";

import { useState } from "react";
import Link from "next/link";
import Chips from "@/components/shared/chips";
import BookCover from "@/components/shared/book-cover";
import type { getEstante } from "@/lib/queries/profile";

type Item = Awaited<ReturnType<typeof getEstante>>[number];

const FILTERS = [
  { id: "ALL", label: "Tudo" },
  { id: "READING", label: "Lendo" },
  { id: "WANT", label: "Quero ler" },
  { id: "READ", label: "Lidos" },
  { id: "REREADING", label: "Relendo" },
  { id: "ABANDONED", label: "Abandonados" },
] as const;

const BADGE: Record<Item["status"], string> = {
  READING: "Lendo",
  WANT: "Quero ler",
  READ: "Lido",
  REREADING: "Relendo",
  ABANDONED: "Abandonado",
};

export default function EstanteTab({
  items,
  initial,
}: {
  items: Item[];
  initial?: string;
}) {
  const valid = FILTERS.some((f) => f.id === initial);
  const [filter, setFilter] = useState<string>(valid ? initial! : "ALL");
  const shown =
    filter === "ALL" ? items : items.filter((i) => i.status === filter);

  return (
    <>
      <Chips
        label="Mostrar"
        value={filter}
        onChange={setFilter}
        options={FILTERS.map((f) => ({
          id: f.id,
          label: f.label,
          count:
            f.id === "ALL"
              ? items.length
              : items.filter((i) => i.status === f.id).length,
        }))}
      />
      {shown.length === 0 ? (
        <p className="m-0 text-[14px] text-(--ink-4)">
          Nenhum livro aqui ainda.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4.5 gap-y-6 sm:gap-y-7">
          {shown.map((it) => (
            <Link
              href={`/book/${it.book.id}`}
              className="flex flex-col gap-2 transition-transform duration-120 hover:-translate-y-0.5"
              key={it.book.id}
            >
              <div className="relative">
                <BookCover
                  book={it.book}
                  size="md"
                  style={{ width: "100%", aspectRatio: "2/3" }}
                />
                {filter === "ALL" && (
                  <span className="absolute top-2 left-2 font-mono text-[9px] uppercase tracking-[0.06em] bg-(--ink-2) text-(--yellow) py-0.75 px-2 rounded-full z-2">
                    {BADGE[it.status]}
                  </span>
                )}
                {it.progress != null && (
                  <div className="absolute left-2 right-2 bottom-2 h-1 rounded-sm bg-[rgba(255,255,255,0.35)] overflow-hidden z-2">
                    <div
                      className="h-full bg-(--yellow)"
                      style={{ width: it.progress + "%" }}
                    />
                  </div>
                )}
              </div>
              <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight">
                {it.book.title}
              </div>
              <div className="text-[11px] text-(--ink-4) -mt-0.75">
                {it.book.author}
              </div>
              {it.since && (
                <div className="font-mono text-[10px] text-(--ink-5) tracking-[0.04em]">
                  {it.since}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
