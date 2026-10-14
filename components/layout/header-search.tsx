"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { GoogleBooksVolume } from "@/lib/types/book";

const DEBOUNCE_MS = 600;

function CoverThumb({ vol }: { vol: GoogleBooksVolume }) {
  const url = vol.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:");
  if (url) {
    return (
      <div className="w-8 h-12 rounded shrink-0 overflow-hidden">
        <Image
          src={url}
          alt=""
          width={32}
          height={48}
          className="object-cover w-full h-full"
          sizes="32px"
        />
      </div>
    );
  }
  return (
    <div className="w-8 h-12 rounded shrink-0 bg-(--cream-deep) flex items-center justify-center text-[16px]">
      📖
    </div>
  );
}

export default function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBooksVolume[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/books/search?q=${encodeURIComponent(trimmed)}&max=8`,
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        const items: GoogleBooksVolume[] = data.items ?? [];
        setResults(items);
        setOpen(items.length > 0);
        setFocusedIdx(-1);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
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

  const navigate = (vol: GoogleBooksVolume) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/book/${vol.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && focusedIdx >= 0) {
      e.preventDefault();
      navigate(results[focusedIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setFocusedIdx(-1);
      inputRef.current?.blur();
    }
  };

  const clear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const isActive = open || query.length > 0;

  return (
    <div ref={containerRef} className="relative w-110">
      {/* Input */}
      <label
        className={[
          "h-10 rounded-[10px] bg-(--cream) flex items-center gap-2.5 px-4 cursor-text",
          "border transition-[border-color,box-shadow] duration-150",
          isActive
            ? "border-[rgba(67,62,18,0.20)] shadow-[0_4px_14px_-6px_rgba(67,62,18,0.18)]"
            : "border-[rgba(67,62,18,0.07)]",
        ].join(" ")}
      >
        {loading ? (
          <svg
            className="text-(--ink-4) shrink-0 animate-spin"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg
            className="text-(--ink-3) shrink-0"
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
        )}

        <input
          ref={inputRef}
          id="header-search"
          className="border-0 bg-transparent w-full text-[13px] text-(--ink-2) outline-none placeholder:text-(--ink-4)"
          placeholder="Busque por título, autor, editora, ISBN…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          autoComplete="off"
          spellCheck={false}
        />

        {query && (
          <button
            className="text-(--ink-4) hover:text-(--ink-2) transition-colors duration-100 shrink-0"
            onClick={clear}
            tabIndex={-1}
            aria-label="Limpar"
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

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-[14px] bg-(--cream) border border-[rgba(67,62,18,0.09)] shadow-[0_20px_60px_-16px_rgba(67,62,18,0.28),0_4px_12px_-4px_rgba(67,62,18,0.10)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-[rgba(67,62,18,0.06)]">
            <span className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase">
              {results.length} resultado{results.length !== 1 ? "s" : ""} para
              &ldquo;{query}&rdquo;
            </span>
            <span className="font-mono text-[10px] text-(--ink-5) tracking-[0.04em]">
              ↑↓ navegar · Enter abrir
            </span>
          </div>

          {/* Results */}
          <ul className="max-h-80 overflow-y-auto overscroll-contain">
            {results.map((vol, i) => {
              const info = vol.volumeInfo;
              const isFocused = i === focusedIdx;
              return (
                <li key={vol.id}>
                  <button
                    className={[
                      "w-full text-left px-4 py-3 flex items-center gap-3.5",
                      "transition-colors duration-100 group",
                      isFocused
                        ? "bg-(--yellow-soft)"
                        : "hover:bg-[rgba(67,62,18,0.04)]",
                      i < results.length - 1
                        ? "border-b border-[rgba(67,62,18,0.05)]"
                        : "",
                    ].join(" ")}
                    onClick={() => navigate(vol)}
                    onMouseEnter={() => setFocusedIdx(i)}
                    onMouseLeave={() => setFocusedIdx(-1)}
                  >
                    <CoverThumb vol={vol} />

                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-(--ink-2) leading-[1.3] line-clamp-1">
                        {info.title}
                        {info.subtitle && (
                          <span className="font-normal text-(--ink-4)">
                            {" "}
                            · {info.subtitle}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-(--ink-4) mt-0.5 truncate">
                        {info.authors?.join(", ") ?? "Autor desconhecido"}
                      </div>

                      <div className="flex items-center gap-2.5 mt-1">
                        {info.pageCount ? (
                          <span className="font-mono text-[10px] text-(--ink-5) tracking-[0.03em]">
                            {info.pageCount} pág.
                          </span>
                        ) : null}
                        {info.publishedDate ? (
                          <span className="font-mono text-[10px] text-(--ink-5) tracking-[0.03em]">
                            {info.publishedDate.slice(0, 4)}
                          </span>
                        ) : null}
                        {info.categories?.[0] ? (
                          <span className="font-mono text-[10px] text-(--ink-5) tracking-[0.03em] truncate">
                            {info.categories[0]}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <svg
                      className={[
                        "shrink-0 transition-[opacity,transform] duration-150",
                        isFocused
                          ? "opacity-70 translate-x-0"
                          : "opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0",
                      ].join(" ")}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[rgba(67,62,18,0.06)] flex items-center justify-between">
            <span className="text-[11px] text-(--ink-4)">
              Powered by Google Books
            </span>
            <span className="font-mono text-[10px] text-(--ink-5) tracking-[0.04em]">
              Esc fechar
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
