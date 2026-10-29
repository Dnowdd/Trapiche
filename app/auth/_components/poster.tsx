"use client";

import React, { useEffect, useState } from "react";
import BookCover from "@/components/shared/book-cover";
import type { Book } from "@/lib/types/book";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const BOOK_SHADOW =
  "0 40px 60px -30px rgba(0,0,0,0.7),0 10px 24px -12px rgba(0,0,0,0.5)";
const BOOK_TRANSITION =
  "transform 0.7s cubic-bezier(0.2,0.8,0.2,1),opacity 0.5s";
const bookAnim = (delay: string) =>
  `bookFloat 6s ease-in-out ${delay} infinite`;

const POSITIONS: React.CSSProperties[] = [
  {
    position: "absolute",
    left: 18,
    top: 40,
    transform: "rotate(-12deg)",
    zIndex: 1,
    width: 190,
    height: 286,
    borderRadius: 5,
    boxShadow: BOOK_SHADOW,
    transition: BOOK_TRANSITION,
    animation: bookAnim("0s"),
  },
  {
    position: "absolute",
    left: 116,
    top: 14,
    transform: "rotate(-1deg)",
    zIndex: 3,
    width: 190,
    height: 286,
    borderRadius: 5,
    boxShadow: BOOK_SHADOW,
    transition: BOOK_TRANSITION,
    animation: bookAnim("0.6s"),
  },
  {
    position: "absolute",
    left: 214,
    top: 44,
    transform: "rotate(11deg)",
    zIndex: 2,
    width: 190,
    height: 286,
    borderRadius: 5,
    boxShadow: BOOK_SHADOW,
    transition: BOOK_TRANSITION,
    animation: bookAnim("1.2s"),
  },
];

interface PosterProps {
  books: Book[];
}

export default function Poster({ books }: PosterProps) {
  const [picked, setPicked] = useState(() => books.slice(0, 3));

  useEffect(() => {
    setPicked(shuffle(books).slice(0, 3));
  }, [books]);

  const reshuffle = () => setPicked(shuffle(books).slice(0, 3));

  return (
    <div className="relative bg-[#2b2710] text-(--cream) py-12 px-14 flex flex-col justify-between overflow-hidden min-h-screen before:content-[''] before:absolute before:inset-0 before:[background:radial-gradient(120%_80%_at_75%_15%,rgba(255,231,103,0.16),transparent_55%),radial-gradient(90%_70%_at_10%_100%,rgba(255,231,103,0.07),transparent_60%)] before:pointer-events-none after:content-[''] after:absolute after:inset-0 after:bg-[radial-gradient(rgba(255,248,213,0.05)_1px,transparent_1px)] after:bg-size-[4px_4px] after:mix-blend-overlay after:pointer-events-none">
      <div className="relative z-1 flex items-center justify-between">
        <div className="text-[26px] font-extrabold tracking-[-0.02em] text-(--cream) flex items-baseline gap-2">
          Trapiche
        </div>
      </div>

      <div className="relative z-1 flex-1 flex items-center justify-center my-5">
        <div
          className="relative w-105 h-90"
          onClick={reshuffle}
          style={{ cursor: "pointer" }}
        >
          {picked.map((b, i) => (
            <BookCover key={b.id} book={b} size="lg" style={POSITIONS[i]} />
          ))}
          <div className="absolute -bottom-4.5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-[rgba(255,248,213,0.55)] tracking-[0.06em] border border-[rgba(255,248,213,0.18)] rounded-full py-1.25 px-3 inline-flex items-center gap-1.75 bg-[rgba(43,39,16,0.6)] [backdrop-filter:blur(4px)]">
            <span className="w-1.25 h-1.25 rounded-full bg-(--yellow)"></span>
            toda visita, uma estante diferente
          </div>
        </div>
      </div>

      <div className="relative z-1 max-w-115">
        <span className="text-[56px] leading-[0.4] text-(--yellow) opacity-60 font-bold block mb-4.5">
          &quot;
        </span>
        <blockquote className="m-0 mb-4.5 text-[19px] leading-normal text-[rgba(255,248,213,0.92)] tracking-[-0.005em] text-pretty">
          Lia-os todos numa ânsia que era quase febre. Os livros lhe traziam
          notícias daquele mundo que ele desejava percorrer.
        </blockquote>
        <cite className="not-italic font-mono text-[10px] tracking-widest uppercase text-(--yellow) inline-flex items-center gap-2.5">
          <span className="w-6 h-px bg-(--yellow) opacity-60"></span>
          Jorge Amado · Capitães da Areia
        </cite>
      </div>
    </div>
  );
}
