import { type CSSProperties } from "react";
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

const sizeMap = {
  sm: { wrap: "py-2.5 px-2.25", title: "text-[14px]", author: "text-[9px]" },
  md: { wrap: "py-3 px-2.75", title: "text-[16px]", author: "text-[10px]" },
  lg: { wrap: "py-4 px-3.5", title: "text-[18px]", author: "text-[10px]" },
} as const;

const BookCover = ({
  book,
  size = "lg",
  style,
  loading,
  sizes,
}: BookCoverProps) => {
  const p = book.palette ?? {};
  const s = sizeMap[size];

  if (book.coverUrl) {
    return (
      <div
        className="rounded relative overflow-hidden"
        style={{ ...style, background: p.bg ?? "#2a2920" }}
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
        />
      </div>
    );
  }

  return (
    <div
      className={[
        "rounded relative overflow-hidden flex flex-col justify-between",
        "bg-(--cover-bg) text-(--cover-fg) font-['Inter',sans-serif]",
        s.wrap,
        "before:content-[''] before:absolute before:inset-0",
        "before:bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_30%)]",
        "before:bg-size-[3px_3px,100%_100%]",
        "before:mix-blend-overlay before:pointer-events-none",
        "after:content-[''] after:absolute after:left-0 after:top-0 after:bottom-0 after:w-2",
        "after:bg-[linear-gradient(90deg,rgba(0,0,0,0.18),transparent)]",
        "after:pointer-events-none",
      ].join(" ")}
      style={
        {
          "--cover-bg": p.bg ?? "#2a2920",
          "--cover-fg": p.fg ?? "#fff",
          ...style,
        } as CSSProperties
      }
    >
      <div className="cover-top flex justify-between items-start gap-2">
        {p.pub && (
          <span className="cover-pub font-mono text-[9px] tracking-[0.08em] opacity-60 uppercase">
            {p.pub}
          </span>
        )}

        <span className="cover-glyph font-mono text-[9px] opacity-60">
          {book.glyph}
        </span>
      </div>

      <div
        className={`cover-title ${s.title} font-extrabold leading-[1.05] tracking-[-0.01em] text-balance`}
      >
        {book.title}
      </div>

      <div
        className={`cover-author ${s.author} font-medium opacity-75 tracking-[0.02em] uppercase`}
      >
        {book.author}
      </div>
    </div>
  );
};

export default BookCover;
