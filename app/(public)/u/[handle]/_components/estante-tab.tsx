"use client";

import { useState } from "react";
import Link from "next/link";
import Chips from "@/components/shared/chips";
import BookCover from "@/components/shared/book-cover";
import { useAction } from "@/components/reading/use-action";
import { toast } from "@/components/shared/toast";
import { returnToPile } from "@/lib/actions/shelf";
import type { getEstante } from "@/lib/queries/profile";
import type { getUserTags } from "@/lib/queries/tags";
import TagChip from "@/components/tags/tag-chip";
import ManageTags from "@/components/tags/manage-tags";
import { cn } from "@/lib/utils";
import { normalize } from "@/lib/editions";
import { Search, X } from "lucide-react";

const SORTS = {
  recent: {
    label: "Mudança mais recente",
    by: (a: Item, b: Item) => b.changedAt - a.changedAt,
  },
  added: {
    label: "Adicionados por último",
    by: (a: Item, b: Item) => b.addedAt - a.addedAt,
  },
  finished: {
    label: "Terminados por último",
    by: (a: Item, b: Item) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0),
  },
  rating: {
    label: "Maior nota",
    by: (a: Item, b: Item) => (b.rating ?? -1) - (a.rating ?? -1),
  },
  title: {
    label: "Título (A–Z)",
    by: (a: Item, b: Item) => a.book.title.localeCompare(b.book.title, "pt-BR"),
  },
  author: {
    label: "Autor (A–Z)",
    by: (a: Item, b: Item) =>
      a.book.author.localeCompare(b.book.author, "pt-BR"),
  },
} as const;
type SortId = keyof typeof SORTS;

const STATUS_SHORT: Record<string, string> = {
  READ: "Lido",
  READING: "Lendo",
  WANT: "Quero ler",
  REREADING: "Relendo",
  ABANDONED: "Abandonado",
};

type Tags = Awaited<ReturnType<typeof getUserTags>>;

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

function CoverTile({ it, withStatus }: { it: Item; withStatus?: boolean }) {
  const badge = withStatus
    ? STATUS_SHORT[it.status]
    : it.status === "REREADING"
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
    <article className="bg-(--cream-card) border border-[rgba(var(--ink-rgb),0.07)] rounded-[18px] p-4 sm:py-5 sm:px-6 grid grid-cols-[56px_1fr] sm:grid-cols-[72px_1fr_auto] gap-4 sm:gap-6 items-center">
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
          <div className="flex-1 max-w-60 h-1.25 rounded-[3px] bg-[rgba(var(--ink-rgb),0.1)] overflow-hidden">
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
          <span className="font-mono text-[10px] py-0.75 px-2 rounded bg-[rgba(var(--ink-rgb),0.06)] text-(--ink-4) tracking-[0.04em] uppercase">
            sem planos de voltar
          </span>
        )}
      </div>
    </article>
  );
}

export default function EstanteTab({
  items,
  tags,
  initial,
  initialTag,
  handle,
  isOwner,
}: {
  items: Item[];
  tags: Tags;
  initial?: string;
  initialTag?: string;
  handle: string;
  isOwner: boolean;
}) {
  const [tag, setTag] = useState<string | null>(
    tags.some((t) => t.id === initialTag) ? initialTag! : null,
  );
  const activeTag = tags.find((t) => t.id === tag) ?? null;
  const countOf = (s: Status) => items.filter((i) => i.status === s).length;
  const fallback =
    countOf("READ") > 0
      ? "READ"
      : (FILTERS.find((f) => countOf(f.id) > 0)?.id ?? "READ");
  const [filter, setFilter] = useState<Status>(
    FILTERS.some((f) => f.id === initial) ? (initial as Status) : fallback,
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortId>("recent");
  const term = normalize(query.trim());
  const searching = term.length > 0;
  const base = searching
    ? items.filter((i) =>
        normalize(`${i.book.title} ${i.book.author}`).includes(term),
      )
    : activeTag
      ? items.filter((i) => i.tags.includes(activeTag.id))
      : items.filter((i) => i.status === filter);
  const shown = [...base].sort(SORTS[sort].by);

  const sync = (status: string, tagId: string | null) =>
    window.history.replaceState(
      null,
      "",
      `/u/${handle}?tab=estante&status=${status}${tagId ? `&tag=${tagId}` : ""}`,
    );
  const select = (id: string) => {
    setFilter(id as Status);
    setTag(null);
    sync(id, null);
  };
  const pickTag = (id: string) => {
    const next = tag === id ? null : id;
    setTag(next);
    sync(filter, next);
  };
  const visibleTags = tags.filter((t) => t.count > 0 || isOwner);

  return (
    <>
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
          <label className="relative flex-1">
            <span className="sr-only">Buscar na estante</span>
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--ink-4) pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Buscar entre ${items.length} ${items.length === 1 ? "livro" : "livros"} por título ou autor`}
              className="w-full h-10 rounded-[10px] border-[1.5px] border-[rgba(var(--ink-rgb),0.14)] bg-(--cream-card) pl-10 pr-9 text-[13.5px] text-(--ink-2) outline-none focus:border-(--ink-3) placeholder:text-(--ink-4) [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 size-6 rounded-full flex items-center justify-center text-(--ink-4) hover:text-(--ink-2) cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </label>
          <label className="relative sm:w-60">
            <span className="sr-only">Ordenar</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortId)}
              className="w-full h-10 appearance-none rounded-[10px] border-[1.5px] border-[rgba(var(--ink-rgb),0.14)] bg-(--cream-card) px-3.5 pr-9 text-[13px] text-(--ink-2) outline-none focus:border-(--ink-3) cursor-pointer"
            >
              {(Object.keys(SORTS) as SortId[]).map((id) => (
                <option key={id} value={id}>
                  {SORTS[id].label}
                </option>
              ))}
            </select>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-(--ink-4) pointer-events-none"
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </label>
        </div>
      )}
      {!searching && (visibleTags.length > 0 || isOwner) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mr-1">
            Tags
          </span>
          {visibleTags.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tag === t.id}
              onClick={() => pickTag(t.id)}
              className="cursor-pointer"
            >
              <TagChip
                name={t.name}
                color={t.color}
                isPrivate={t.private}
                active={tag === t.id}
              >
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    tag === t.id ? "text-(--yellow-soft)" : "text-(--ink-5)",
                  )}
                >
                  {t.count}
                </span>
              </TagChip>
            </button>
          ))}
          {isOwner && <ManageTags tags={tags} />}
        </div>
      )}
      {searching ? (
        <div className="mb-[22px] text-[13px] text-(--ink-3)">
          {shown.length} {shown.length === 1 ? "resultado" : "resultados"} em
          toda a estante
        </div>
      ) : activeTag ? (
        <div className="mb-[22px] flex items-center gap-3 text-[13px] text-(--ink-3)">
          <span>
            {shown.length} {shown.length === 1 ? "livro" : "livros"} com a tag{" "}
            <strong className="text-(--ink-2)">{activeTag.name}</strong>
          </span>
          <button
            type="button"
            onClick={() => pickTag(activeTag.id)}
            className="text-[12px] border-b border-(--ink-4) pb-px cursor-pointer hover:text-(--ink)"
          >
            Limpar filtro
          </button>
        </div>
      ) : (
        <Chips
          value={filter}
          onChange={select}
          options={FILTERS.map((f) => ({
            id: f.id,
            label: f.label,
            count: countOf(f.id),
          }))}
        />
      )}
      {shown.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[rgba(var(--ink-rgb),0.18)] py-14 px-6 text-center text-[14px] text-(--ink-4)">
          {searching
            ? `Nada na estante com “${query.trim()}”.`
            : activeTag
              ? "Nenhum livro da estante com essa tag."
              : EMPTY[filter][isOwner ? "owner" : "visitor"]}
        </div>
      ) : !searching && !activeTag && filter === "ABANDONED" ? (
        <div className="flex flex-col gap-3.5">
          {shown.map((it) => (
            <AbandonedRow key={it.book.id} it={it} isOwner={isOwner} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4.5 gap-y-6 sm:gap-y-7">
          {shown.map((it) => (
            <CoverTile key={it.book.id} it={it} withStatus={searching} />
          ))}
        </div>
      )}
    </>
  );
}
