"use client";

import { useMemo, useState } from "react";
import Chips from "@/components/shared/chips";
import QuoteCard from "@/components/quotes/quote-card";
import type { getProfileQuotes } from "@/lib/queries/quotes";

type Item = Awaited<ReturnType<typeof getProfileQuotes>>[number];

export default function CitacoesTab({
  items,
  isOwner,
  loggedIn,
}: {
  items: Item[];
  isOwner: boolean;
  loggedIn: boolean;
}) {
  const [filter, setFilter] = useState("todos");
  const books = useMemo(() => {
    const map = new Map<string, { id: string; title: string; count: number }>();
    for (const q of items) {
      const prev = map.get(q.book.id);
      if (prev) prev.count += 1;
      else map.set(q.book.id, { id: q.book.id, title: q.book.title, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [items]);
  const shown =
    filter === "todos" ? items : items.filter((q) => q.book.id === filter);

  if (items.length === 0)
    return (
      <div className="rounded-[18px] border border-dashed border-[rgba(var(--ink-rgb),0.2)] py-14 px-6 text-center">
        <div className="font-serif text-[56px] leading-none text-(--yellow-deep)">
          “
        </div>
        <div className="mt-1 text-[17px] font-bold text-(--ink)">
          {isOwner ? "Seu caderno de citações" : "Nenhuma citação por aqui"}
        </div>
        <p className="m-0 mt-1.5 text-[14px] text-(--ink-4) max-w-100 mx-auto">
          {isOwner
            ? "Abra um livro e use “Guardar citação” para colecionar os trechos que te marcaram. Eles aparecem aqui."
            : "Quando guardar trechos de livros, eles aparecem aqui."}
        </p>
      </div>
    );

  return (
    <>
      {books.length > 1 && (
        <Chips
          label="Livro"
          value={filter}
          onChange={setFilter}
          options={[
            { id: "todos", label: "Todos", count: items.length },
            ...books.map((b) => ({ id: b.id, label: b.title, count: b.count })),
          ]}
        />
      )}
      <div className="columns-1 md:columns-2 gap-4 [&>*]:mb-4 [&>*]:break-inside-avoid">
        {shown.map((q) => (
          <QuoteCard
            key={q.id}
            quote={q}
            book={q.book}
            bookId={q.book.id}
            bookTitle={q.book.title}
            showAuthor={false}
            loggedIn={loggedIn}
          />
        ))}
      </div>
    </>
  );
}
