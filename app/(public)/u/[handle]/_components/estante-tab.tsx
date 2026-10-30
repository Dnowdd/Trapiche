"use client";

import { useState } from "react";
import Link from "next/link";
import Chips from "@/components/shared/chips";
import BookCover from "@/components/shared/book-cover";
import { useAction } from "@/components/reading/use-action";
import { toast } from "@/components/shared/toast";
import { returnToPile } from "@/lib/actions/shelf";
import type { getEstante } from "@/lib/queries/profile";

type Item = Awaited<ReturnType<typeof getEstante>>[number];
type Status = Item["status"];

const FILTERS: { id: Status; label: string }[] = [
  { id: "READ", label: "Lidos" },
  { id: "READING", label: "Lendo" },
  { id: "WANT", label: "Quero ler" },
  { id: "REREADING", label: "Relendo" },
  { id: "ABANDONED", label: "Abandonados" },
];

const EMPTY: Record<Status, { owner: string; visitor: string }> = {
  READ: {
    owner: "Quando terminar um livro, ele aparece aqui.",
    visitor: "Nenhum livro lido ainda.",
  },
  READING: {
    owner: "Nenhuma leitura em andamento. Abra um livro e marque “Lendo”.",
    visitor: "Nenhuma leitura em andamento.",
  },
  WANT: {
    owner:
      "Sua pilha está vazia. Marque “Quero ler” nos livros que te chamarem.",
    visitor: "A pilha de quero ler está vazia.",
  },
  REREADING: {
    owner: "Voltou a um livro que já leu? Marque “Relendo” na página dele.",
    visitor: "Nenhuma releitura em andamento.",
  },
  ABANDONED: {
    owner: "Nenhum livro abandonado. E se tiver, tudo bem.",
    visitor: "Nenhum livro abandonado.",
  },
};

function BackToPile({ bookId }: { bookId: string }) {
  const { pending, run } = useAction();
  return (
    <button
      disabled={pending}
      onClick={() =>
        run(
          () => returnToPile(bookId),
          () => toast("De volta para a pilha de quero ler."),
          toast,
        )
      }
      className="text-[11px] py-1.5 px-3 border border-(--ink-3) rounded-md text-(--ink-2) font-medium cursor-pointer hover:bg-(--yellow-soft) disabled:cursor-wait disabled:opacity-60"
    >
      ↺ Voltar à pilha
    </button>
  );
}

function CoverTile({ it }: { it: Item }) {
  const badge =
    it.status === "REREADING"
      ? `${Math.max(2, it.reads)}ª leitura`
      : it.status === "READ" && it.reads > 1
        ? `lido ${it.reads}×`
        : null;
  return (
    <Link
      href={`/book/${it.book.id}`}
      className="group flex flex-col gap-2 min-w-0"
    >
      <div className="relative transition-transform duration-150 group-hover:-translate-y-1">
        <BookCover
          book={it.book}
          size="md"
          style={{ width: "100%", aspectRatio: "2/3" }}
        />
        {badge && (
          <span className="absolute top-2 left-2 font-mono text-[9px] uppercase tracking-[0.06em] bg-(--ink-2) text-(--yellow) py-0.75 px-2 rounded-full z-2">
            {badge}
          </span>
        )}
        {it.progress != null && (
          <div className="absolute left-2 right-2 bottom-2 h-1 rounded-sm bg-[rgba(255,255,255,0.4)] overflow-hidden z-2 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
            <div
              className="h-full bg-(--yellow)"
              style={{ width: it.progress + "%" }}
            />
          </div>
        )}
      </div>
      <div>
        <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight line-clamp-2">
          {it.book.title}
        </div>
        <div className="text-[11px] text-(--ink-4) mt-0.5 truncate">
          {it.book.author}
        </div>
        {(it.date || it.progress != null) && (
          <div className="mt-1 font-mono text-[10px] text-(--ink-5) tracking-[0.04em]">
            {[it.progress != null && `${it.progress}%`, it.date]
              .filter(Boolean)
              .join(" · ")}
          </div>
        )}
      </div>
    </Link>
  );
}

function AbandonedRow({ it, isOwner }: { it: Item; isOwner: boolean }) {
  const a = it.abandoned!;
  return (
    <article className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-4 sm:py-5 sm:px-6 grid grid-cols-[56px_1fr] sm:grid-cols-[72px_1fr_auto] gap-4 sm:gap-6 items-center">
      <Link href={`/book/${it.book.id}`}>
        <BookCover
          book={it.book}
          size="sm"
          sizes="72px"
          style={{ width: "100%", aspectRatio: "2/3" }}
        />
      </Link>
      <div className="min-w-0">
        <Link
          href={`/book/${it.book.id}`}
          className="text-[16px] font-bold text-(--ink) tracking-[-0.01em] hover:underline"
        >
          {it.book.title}
        </Link>
        <div className="text-[12px] text-(--ink-4) mt-0.5">
          {it.book.author}
        </div>
        <div className="mt-3 flex items-center gap-2.5 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] [&_strong]:text-(--ink-2)">
          <div className="flex-1 max-w-60 h-1.25 rounded-[3px] bg-[rgba(67,62,18,0.1)] overflow-hidden">
            <div
              className="h-full bg-(--ink-3) rounded-[3px]"
              style={{ width: a.percent + "%" }}
            />
          </div>
          <span>
            parou em <strong>{a.percent}%</strong>
            {a.total ? ` · pág. ${a.page} de ${a.total}` : ""}
          </span>
        </div>
        {a.reason && (
          <div className="mt-3 text-[13px] text-(--ink-3) italic leading-normal border-l-2 border-(--rule) pl-3 max-w-140">
            &quot;{a.reason}&quot;
          </div>
        )}
      </div>
      <div className="col-span-2 sm:col-span-1 flex flex-wrap sm:flex-col items-center sm:items-end gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-(--rule)">
        <span className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase">
          {[
            a.at,
            a.spentDays != null &&
              `${a.spentDays} ${a.spentDays === 1 ? "dia" : "dias"}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {a.again ? (
          isOwner ? (
            <BackToPile bookId={it.book.id} />
          ) : (
            <span className="font-mono text-[10px] py-0.75 px-2 rounded bg-(--yellow-soft) text-(--ink-3) tracking-[0.04em] uppercase">
              pretende voltar
            </span>
          )
        ) : (
          <span className="font-mono text-[10px] py-0.75 px-2 rounded bg-[rgba(67,62,18,0.06)] text-(--ink-4) tracking-[0.04em] uppercase">
            sem planos de voltar
          </span>
        )}
      </div>
    </article>
  );
}

export default function EstanteTab({
  items,
  initial,
  handle,
  isOwner,
}: {
  items: Item[];
  initial?: string;
  handle: string;
  isOwner: boolean;
}) {
  const countOf = (s: Status) => items.filter((i) => i.status === s).length;
  const fallback =
    countOf("READ") > 0
      ? "READ"
      : (FILTERS.find((f) => countOf(f.id) > 0)?.id ?? "READ");
  const [filter, setFilter] = useState<Status>(
    FILTERS.some((f) => f.id === initial) ? (initial as Status) : fallback,
  );
  const shown = items.filter((i) => i.status === filter);

  const select = (id: string) => {
    setFilter(id as Status);
    window.history.replaceState(
      null,
      "",
      `/u/${handle}?tab=estante&status=${id}`,
    );
  };

  return (
    <>
      <Chips
        value={filter}
        onChange={select}
        options={FILTERS.map((f) => ({
          id: f.id,
          label: f.label,
          count: countOf(f.id),
        }))}
      />
      {shown.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[rgba(67,62,18,0.18)] py-14 px-6 text-center text-[14px] text-(--ink-4)">
          {EMPTY[filter][isOwner ? "owner" : "visitor"]}
        </div>
      ) : filter === "ABANDONED" ? (
        <div className="flex flex-col gap-3.5">
          {shown.map((it) => (
            <AbandonedRow key={it.book.id} it={it} isOwner={isOwner} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4.5 gap-y-6 sm:gap-y-7">
          {shown.map((it) => (
            <CoverTile key={it.book.id} it={it} />
          ))}
        </div>
      )}
    </>
  );
}
