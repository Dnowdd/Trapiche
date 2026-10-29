"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { SearchResult } from "@/lib/types/book";

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

export default function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/books/search?q=${encodeURIComponent(trimmed)}&max=8`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setResults(data.items ?? []);
        setOpen(true);
        setFocusedIdx(-1);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

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
    setResults(null);
    setOpen(false);
    setLoading(false);
  };

  const navigate = (item: SearchResult) => {
    reset();
    inputRef.current?.blur();
    router.push(`/book/${item.id}`);
  };

  const onChange = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults(null);
      setOpen(false);
      setLoading(false);
    }
  };

  const items = results ?? [];
  const showDropdown = open && results !== null && trimmed.length >= 2;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setFocusedIdx(-1);
      inputRef.current?.blur();
      return;
    }
    if (!showDropdown || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      navigate(items[Math.max(focusedIdx, 0)]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-110">
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
            if (results !== null) setOpen(true);
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
          {items.length === 0 ? (
            <div className="px-5 py-6 text-center text-[13px] text-(--ink-4)">
              Nenhum livro encontrado para “{trimmed}”
            </div>
          ) : (
            <ul className="max-h-105 overflow-y-auto overscroll-contain p-1.5">
              {items.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={[
                      "w-full text-left px-3 py-2.5 rounded-[10px] flex items-center gap-3.5",
                      "transition-colors duration-100",
                      i === focusedIdx ? "bg-[rgba(67,62,18,0.06)]" : "",
                    ].join(" ")}
                    onClick={() => navigate(item)}
                    onMouseEnter={() => setFocusedIdx(i)}
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
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
