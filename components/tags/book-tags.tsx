"use client";

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { Plus, Check } from "lucide-react";
import { toast } from "@/components/shared/toast";
import { createTag, setBookTags } from "@/lib/actions/tags";
import type { BookTags as BookTagsData, TagItem } from "@/lib/queries/tags";
import { MAX_TAGS_PER_BOOK, TAG_COLORS } from "@/lib/tags";
import TagChip from "./tag-chip";

export default function BookTags({ data }: { data: BookTagsData }) {
  const [tags, setTags] = useState<TagItem[]>(data.tags);
  const [selected, setSelected] = useOptimistic(data.selected);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const save = (next: string[]) =>
    start(async () => {
      setSelected(next);
      const res = await setBookTags(data.shelfBookId, next);
      if (!res.ok) toast(res.error);
    });

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    if (next.length > MAX_TAGS_PER_BOOK)
      return toast(`Um livro pode ter até ${MAX_TAGS_PER_BOOK} tags.`);
    save(next);
  };

  const term = query.trim();
  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(term.toLowerCase()),
  );
  const exact = tags.some((t) => t.name.toLowerCase() === term.toLowerCase());

  const create = () =>
    start(async () => {
      const res = await createTag({
        name: term,
        color: TAG_COLORS[tags.length % TAG_COLORS.length],
      });
      if (!res.ok || !res.data) return toast(res.ok ? "Erro." : res.error);
      const tag = res.data;
      setTags((prev) =>
        prev.some((t) => t.id === tag.id)
          ? prev
          : [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setQuery("");
      if (!selected.includes(tag.id)) {
        const next = [...selected, tag.id];
        setSelected(next);
        const saved = await setBookTags(data.shelfBookId, next);
        if (!saved.ok) toast(saved.error);
      }
    });

  const chosen = tags.filter((t) => selected.includes(t.id));

  return (
    <div className="flex flex-wrap items-center gap-2" ref={ref}>
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mr-1">
        Suas tags
      </span>
      {chosen.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => toggle(t.id)}
          aria-label={`Tirar a tag ${t.name}`}
          title="Tirar a tag"
          className="cursor-pointer transition-opacity hover:opacity-85"
        >
          <TagChip name={t.name} color={t.color} isPrivate={t.private} />
        </button>
      ))}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-dashed border-[rgba(var(--ink-rgb),0.3)] text-[12px] text-(--ink-3) hover:bg-(--yellow-soft) hover:text-(--ink-2) cursor-pointer"
        >
          <Plus size={13} strokeWidth={2.4} />
          {chosen.length ? "Tag" : "Adicionar tag"}
        </button>
        {open && (
          <div className="absolute left-0 top-9 z-30 w-68 rounded-[14px] bg-(--cream) border border-[rgba(var(--ink-rgb),0.12)] shadow-[0_24px_60px_-20px_rgba(var(--shadow-rgb),0.5)] p-2">
            <input
              autoFocus
              value={query}
              maxLength={32}
              placeholder="Buscar ou criar tag…"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (term && !exact) create();
                else if (filtered[0]) toggle(filtered[0].id);
              }}
              className="w-full h-9 rounded-[9px] bg-(--cream-card) border border-[rgba(var(--ink-rgb),0.14)] px-3 text-[13px] text-(--ink-2) outline-none focus:border-(--ink-3)"
            />
            <div className="mt-1.5 max-h-60 overflow-y-auto flex flex-col">
              {filtered.map((t) => {
                const on = selected.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t.id)}
                    className="flex items-center gap-2.5 h-9 px-2 rounded-[8px] text-left text-[13px] text-(--ink-2) hover:bg-(--yellow-soft) cursor-pointer"
                  >
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ background: t.color }}
                    />
                    <span className="flex-1 truncate">{t.name}</span>
                    {on && <Check size={14} strokeWidth={2.6} />}
                  </button>
                );
              })}
              {term && !exact && (
                <button
                  type="button"
                  onClick={create}
                  className="flex items-center gap-2 h-9 px-2 rounded-[8px] text-left text-[13px] text-(--ink-2) hover:bg-(--yellow-soft) cursor-pointer"
                >
                  <Plus size={14} strokeWidth={2.4} />
                  Criar “<strong className="truncate">{term}</strong>”
                </button>
              )}
              {!term && tags.length === 0 && (
                <p className="m-0 px-2 py-2 text-[12px] text-(--ink-4) leading-normal">
                  Tags são prateleiras suas: “clube do livro”, “emprestados”,
                  “pra reler”. Digite um nome para criar a primeira.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
