"use client";

import { useState } from "react";
import Link from "next/link";
import Chips from "@/components/shared/chips";
import BookCover from "@/components/shared/book-cover";
import type { getReleituras } from "@/lib/queries/profile";

type Item = Awaited<ReturnType<typeof getReleituras>>[number];

export default function ReleiturasTab({ items }: { items: Item[] }) {
  const [sort, setSort] = useState("recente");
  const sorted = [...items].sort((a, b) =>
    sort === "mais" ? b.times - a.times : b.lastTs - a.lastTs,
  );

  return (
    <>
      <Chips
        label="Ordem"
        value={sort}
        onChange={setSort}
        options={[
          { id: "recente", label: "Última releitura" },
          { id: "mais", label: "Mais releituras" },
        ]}
      />
      {sorted.length === 0 ? (
        <p className="m-0 text-[14px] text-(--ink-4)">
          Nenhuma releitura ainda. Quando voltar a um livro, marque “Relendo”.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map((r) => (
            <article
              className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-5 sm:py-5.5 sm:px-6.5 grid grid-cols-[64px_1fr] sm:grid-cols-[100px_1fr_220px] gap-4 sm:gap-6 items-center"
              key={r.book.id}
            >
              <Link href={`/book/${r.book.id}`}>
                <BookCover
                  book={r.book}
                  size="md"
                  sizes="(max-width: 640px) 64px, 100px"
                  style={{ width: "100%", aspectRatio: "2/3" }}
                />
              </Link>
              <div>
                <Link
                  href={`/book/${r.book.id}`}
                  className="text-[17px] font-bold text-(--ink) tracking-[-0.01em] hover:underline"
                >
                  {r.book.title}
                </Link>
                <div className="text-[12px] text-(--ink-4) mt-0.75">
                  {r.book.author}
                </div>
                <div className="mt-2 font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">
                  última: {r.last}
                </div>
                {r.note && (
                  <div className="mt-3 text-[13px] text-(--ink-3) leading-normal italic max-w-120">
                    &quot;{r.note}&quot;
                  </div>
                )}
              </div>
              <div className="col-span-2 sm:col-span-1 flex flex-col gap-2 border-t sm:border-t-0 sm:border-l border-[rgba(67,62,18,0.1)] pt-3 sm:pt-0 sm:pl-5.5">
                <div className="text-[32px] font-extrabold text-(--ink) tracking-[-0.025em] leading-none flex items-baseline gap-1.5">
                  {r.times}{" "}
                  <span className="text-[11px] font-medium text-(--ink-4) tracking-normal font-mono uppercase">
                    vezes
                  </span>
                </div>
                <div className="flex flex-col gap-1 mt-1.5 font-mono text-[11px] text-(--ink-3) tracking-[0.04em]">
                  {r.dates.map((d, j) => {
                    const latest = j === r.dates.length - 1;
                    return (
                      <span
                        key={j}
                        className={`flex items-center ${latest ? "text-(--ink) font-semibold" : ""}`}
                      >
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${latest ? "bg-(--yellow) border border-(--ink-2)" : "bg-(--ink-3)"}`}
                        />
                        {d}
                      </span>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
