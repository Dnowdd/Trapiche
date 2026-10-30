"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { sharpCover } from "@/lib/cover-url";

interface BookCoverProps {
  book: {
    id: string;
    title: string;
    author: string;
    pages: number;
    glyph: string;
    palette: {
      bg: string;
      fg: string;
      pub?: string;
    };
    coverUrl?: string;
  };
  size?: "sm" | "md" | "lg";
  style?: CSSProperties;
  loading?: "lazy" | "eager";
  sizes?: string;
}

const shade =
  "after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:rounded-[inherit] after:bg-[linear-gradient(90deg,rgba(0,0,0,0.22)_0,rgba(255,255,255,0.12)_3%,transparent_7%,transparent_94%,rgba(0,0,0,0.08))] after:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]";

const BookCover = ({ book, style, loading, sizes }: BookCoverProps) => {
  const p = book.palette ?? {};
  const [failed, setFailed] = useState<string | null>(null);

  if (book.coverUrl && failed !== book.coverUrl) {
    return (
      <div
        className={`rounded-[3px] relative overflow-hidden bg-[rgba(67,62,18,0.08)] shadow-[0_1px_2px_rgba(40,36,8,0.12),0_10px_24px_-14px_rgba(40,36,8,0.45)] ${shade}`}
        style={style}
      >
        <Image
          src={sharpCover(book.coverUrl)}
          alt={`Capa de ${book.title}`}
          fill
          className="object-cover"
          sizes={
            sizes ??
            (typeof style?.width === "number"
              ? `${style.width}px`
              : "(max-width: 768px) 45vw, 240px")
          }
          loading={loading}
          onError={() => setFailed(book.coverUrl ?? null)}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Capa de ${book.title}`}
      className={`@container rounded-[3px] relative overflow-hidden bg-(--cover-bg) text-(--cover-fg) shadow-[0_1px_2px_rgba(40,36,8,0.12),0_10px_24px_-14px_rgba(40,36,8,0.45)] ${shade}`}
      style={
        {
          "--cover-bg": p.bg ?? "#2a2920",
          "--cover-fg": p.fg ?? "#fff",
          ...style,
        } as CSSProperties
      }
    >
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(currentColor_0.6px,transparent_0.6px)] bg-size-[4px_4px]" />
      <div className="absolute inset-[6cqw] rounded-[2px] border border-current opacity-25 @max-[70px]:hidden" />
      <div className="relative h-full flex flex-col items-center text-center px-[13cqw] pt-[13cqw] pb-[12cqw] @max-[70px]:p-[9cqw]">
        <span className="cover-top cover-glyph text-[9cqw] leading-none opacity-70 @max-[70px]:hidden">
          {book.glyph}
        </span>
        <div className="flex-1 flex items-center w-full min-h-0">
          <div className="cover-title w-full text-[11.5cqw] @max-[70px]:text-[13cqw] font-extrabold leading-[1.08] tracking-[-0.015em] text-balance wrap-break-word line-clamp-5 @max-[70px]:line-clamp-4">
            {book.title}
          </div>
        </div>
        <div className="cover-author w-full @max-[70px]:hidden">
          <div className="mx-auto mb-[5cqw] h-px w-[18cqw] bg-current opacity-40" />
          <div className="text-[6.2cqw] font-semibold uppercase tracking-[0.12em] opacity-80 line-clamp-2">
            {book.author}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCover;
