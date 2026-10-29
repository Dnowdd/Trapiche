"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { SearchResult } from "@/lib/types/book";
import { authorHref } from "@/lib/links";

const DEBOUNCE_MS = 400;

function CoverThumb({ url }: { url: string | null }) {
  return (
    <div className="w-9 h-13.5 rounded-[3px] shrink-0 overflow-hidden bg-(--cream-deep) shadow-[0_1px_3px_rgba(67,62,18,0.18)]">
      {url && (
        <Image
          src={url}
          alt=""
          width={36}
          height={54}
          className="object-cover w-full h-full"
          sizes="36px"
        />
      )}
    </div>
  );
}

type Entry =
  | { kind: "author"; name: string; works: number }
  | { kind: "book"; item: SearchResult };

interface Found {
  query: string;
  items: SearchResult[];
  authors: { name: string; works: number }[];
  failed?: boolean;
}

export default function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef<AbortController | null>(null);
  const inFlight = useRef<string | null>(null);
  const router = useRouter();

  const trimmed = query.trim();

  const search = useCallback(async (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (inFlight.current === q) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    inFlight.current = q;
    setLoading(true);
    setOpen(true);
    try {
      const res = await fetch(
        `/api/books/search?q=${encodeURIComponent(q)}&max=8`,
        { signal: controller.signal },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFound({
        query: q,
        items: data.items ?? [],
        authors: data.authors ?? [],
      });
      setOpen(true);
      setFocusedIdx(-1);
    } catch {
      if (!controller.signal.aborted)
        setFound({ query: q, items: [], authors: [], failed: true });
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        inFlight.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (trimmed.length < 2) return;
    timer.current = setTimeout(() => search(trimmed), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      request.current?.abort();
      inFlight.current = null;
    };
  }, [trimmed, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const reset = () => {
    setQuery("");
    setFound(null);
    setOpen(false);
    setLoading(false);
  };

  const go = (entry: Entry) => {
    reset();
    inputRef.current?.blur();
    router.push(
      entry.kind === "author"
        ? authorHref(entry.name)
        : `/book/${entry.item.id}`,
    );
  };

  const onChange = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setFound(null);
      setOpen(false);
      setLoading(false);
    }
  };

  const entries: Entry[] = found
    ? [
        ...found.authors.map((a) => ({ kind: "author" as const, ...a })),
        ...found.items.map((item) => ({ kind: "book" as const, item })),
      ]
    : [];
  const fresh = found?.query === trimmed;
  const showDropdown =
    open && trimmed.length >= 2 && (found !== null || loading);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setFocusedIdx(-1);
      inputRef.current?.blur();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (trimmed.length < 2) return;
      if (showDropdown && focusedIdx >= 0 && entries[focusedIdx])
        return go(entries[focusedIdx]);
      if (fresh && entries.length) return go(entries[0]);
      search(trimmed);
      return;
    }
    if (!showDropdown || entries.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, entries.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, -1));
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full order-last md:order-none md:w-110 md:max-w-[40vw] lg:max-w-none"
    >
      <label
        className={[
          "h-10 rounded-[10px] bg-(--cream) flex items-center gap-2.5 px-4 cursor-text",
          "border transition-[border-color,box-shadow] duration-150",
          showDropdown || query
            ? "border-[rgba(67,62,18,0.20)] shadow-[0_4px_14px_-6px_rgba(67,62,18,0.18)]"
            : "border-[rgba(67,62,18,0.07)]",
        ].join(" ")}
      >
        <svg
          className={[
            "shrink-0 text-(--ink-3)",
            loading ? "animate-pulse" : "",
          ].join(" ")}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>

        <input
          ref={inputRef}
          id="header-search"
          className="border-0 bg-transparent w-full text-[13px] text-(--ink-2) outline-none placeholder:text-(--ink-4)"
          placeholder="Busque por título, autor ou ISBN"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (found !== null) setOpen(true);
          }}
          autoComplete="off"
          spellCheck={false}
        />

        {query && (
          <button
            type="button"
            className="text-(--ink-4) hover:text-(--ink-2) transition-colors duration-100 shrink-0"
            onClick={() => {
              reset();
              inputRef.current?.focus();
            }}
            tabIndex={-1}
            aria-label="Limpar busca"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </label>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-[14px] bg-(--cream) border border-[rgba(67,62,18,0.09)] shadow-[0_20px_60px_-16px_rgba(67,62,18,0.28),0_4px_12px_-4px_rgba(67,62,18,0.10)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {loading && (
            <div className="h-0.5 overflow-hidden bg-[rgba(67,62,18,0.06)]">
              <div className="h-full w-1/3 bg-(--ink-3) animate-[search-progress_1s_ease-in-out_infinite]" />
            </div>
          )}
          {!found || (loading && !fresh) ? (
            <div className="px-5 py-5 flex items-center gap-3 text-[13px] text-(--ink-3)">
              <span className="w-4 h-4 rounded-full border-2 border-(--ink-4) border-t-transparent animate-spin" />
              Buscando “{trimmed}”…
            </div>
          ) : entries.length === 0 ? (
            <div className="px-5 py-6 text-center text-[13px] text-(--ink-4)">
              {found.failed ? (
                <>
                  A busca falhou.{" "}
                  <button
                    type="button"
                    className="font-semibold text-(--ink-2) border-b border-(--ink-4) cursor-pointer"
                    onClick={() => search(trimmed)}
                  >
                    Tentar de novo
                  </button>
                </>
              ) : (
                <>Nada encontrado para “{found.query}”</>
              )}
            </div>
          ) : (
            <div className="max-h-110 overflow-y-auto overscroll-contain p-1.5">
              {found.authors.length > 0 && (
                <Group label="Autores">
                  {found.authors.map((a, i) => (
                    <Row
                      key={a.name}
                      active={i === focusedIdx}
                      onSelect={() => go({ kind: "author", ...a })}
                      onHover={() => setFocusedIdx(i)}
                    >
                      <span className="w-9 h-9 rounded-full shrink-0 bg-(--yellow) border border-(--ink-2) flex items-center justify-center text-[12px] font-bold text-(--ink-2)">
                        {initials(a.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-(--ink) truncate">
                          {a.name}
                        </div>
                        <div className="text-[12px] text-(--ink-4)">
                          Autor · ver todas as obras
                        </div>
                      </div>
                    </Row>
                  ))}
                </Group>
              )}
              {found.items.length > 0 && (
                <Group label={found.authors.length ? "Livros" : null}>
                  {found.items.map((item, j) => {
                    const i = found.authors.length + j;
                    return (
                      <Row
                        key={item.id}
                        active={i === focusedIdx}
                        onSelect={() => go({ kind: "book", item })}
                        onHover={() => setFocusedIdx(i)}
                      >
                        <CoverThumb url={item.coverUrl} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-(--ink) leading-[1.3] line-clamp-2 tracking-[-0.005em]">
                            {item.title}
                          </div>
                          <div className="text-[12px] text-(--ink-4) mt-0.5 truncate">
                            {[item.authors.join(", ") || null, item.year]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                          {item.editions > 1 && (
                            <div className="text-[11px] text-(--ink-5) mt-0.5">
                              {item.editions} edições
                            </div>
                          )}
                        </div>
                      </Row>
                    );
                  })}
                </Group>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function Group({
  label,
  children,
}: {
  label: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="[&+&]:mt-1 [&+&]:pt-1 [&+&]:border-t [&+&]:border-[rgba(67,62,18,0.06)]">
      {label && (
        <div className="px-3 pt-2 pb-1 font-mono text-[10px] text-(--ink-4) tracking-[0.08em] uppercase">
          {label}
        </div>
      )}
      <ul className="m-0 p-0 list-none">{children}</ul>
    </div>
  );
}

function Row({
  active,
  onSelect,
  onHover,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        className={[
          "w-full text-left px-3 py-2.5 rounded-[10px] flex items-center gap-3.5 transition-colors duration-100",
          active ? "bg-[rgba(67,62,18,0.06)]" : "",
        ].join(" ")}
        onClick={onSelect}
        onMouseEnter={onHover}
      >
        {children}
      </button>
    </li>
  );
}
