"use client";

import { useMemo, useState } from "react";
import { BOOKS } from "../mock";
import BookCover from "@/components/shared/book-cover";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const BOOK_POSITIONS: React.CSSProperties[] = [
  {
    position: "absolute",
    width: 200,
    height: 300,
    left: 30,
    top: 30,
    transform: "rotate(-9deg)",
    zIndex: 1,
    transition: "transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)",
    boxShadow:
      "0 24px 40px -20px rgba(67,62,18,0.4), 0 4px 10px -4px rgba(67,62,18,0.2)",
  },
  {
    position: "absolute",
    width: 200,
    height: 300,
    left: 130,
    top: 10,
    transform: "rotate(2deg)",
    zIndex: 3,
    transition: "transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)",
    boxShadow:
      "0 24px 40px -20px rgba(67,62,18,0.4), 0 4px 10px -4px rgba(67,62,18,0.2)",
  },
  {
    position: "absolute",
    width: 200,
    height: 300,
    left: 240,
    top: 40,
    transform: "rotate(11deg)",
    zIndex: 2,
    transition: "transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)",
    boxShadow:
      "0 24px 40px -20px rgba(67,62,18,0.4), 0 4px 10px -4px rgba(67,62,18,0.2)",
  },
];

const Hero = () => {
  const [seed, setSeed] = useState(0);
  const picked = useMemo(() => shuffle(BOOKS).slice(0, 3), [seed]);

  return (
    <section
      className="grid grid-cols-2 gap-10 pt-25 px-[125px] pb-[90px] items-center"
      data-screen-label="02 Hero"
    >
      <div>
        <h1 className="m-0 mb-6 text-[64px] font-extrabold leading-[0.98] tracking-[-0.025em] text-(--ink-2)">
          O porto seguro
          <br />
          das suas{" "}
          <em className="not-italic relative inline-block after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-[0.06em] after:h-[0.32em] after:bg-(--yellow) after:z-[-1] after:[transform:skewX(-6deg)]">
            leituras
          </em>
          .
        </h1>

        <p className="m-0 mb-8 max-w-[460px] text-[15px] leading-[1.55] text-(--ink-3)">
          Suas leituras merecem mais do que uma estante silenciosa. No Trapiche,
          a gente celebra quem devora páginas numa ânsia que é quase febre — sem
          ranking, sem rede social, só você e os seus livros.
        </p>

        <div className="flex items-center gap-3.5">
          <a
            className="bg-(--yellow) text-(--ink) py-3 px-5.5 rounded-lg text-[14px] font-semibold inline-flex items-center gap-2 border border-(--yellow-deep) transition-[transform,box-shadow] duration-[120ms] hover:-translate-y-px hover:shadow-[0_6px_16px_-8px_rgba(67,62,18,0.4)]"
            href="#"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22V8"></path>
              <path d="M5 12V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7"></path>
              <circle cx="12" cy="22" r="0.5"></circle>
              <path d="M8 22h8"></path>
            </svg>
            Atracar meus livros
          </a>

          <a
            className="text-[14px] text-(--ink-3) font-medium inline-flex items-center gap-1.5 hover:text-(--ink-2)"
            href="#como-funciona"
          >
            Como funciona
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </a>
        </div>

        <div className="mt-9 flex gap-8 font-mono text-[11px] text-(--ink-4) tracking-[0.04em]">
          <div>
            <strong className="block font-['Inter',sans-serif] text-[20px] font-bold text-(--ink-2) tracking-[-0.01em] mb-0.5">
              14.8k
            </strong>
            leitoras &amp; leitores
          </div>
          <div>
            <strong className="block font-['Inter',sans-serif] text-[20px] font-bold text-(--ink-2) tracking-[-0.01em] mb-0.5">
              312k
            </strong>
            livros cadastrados
          </div>
          <div>
            <strong className="block font-['Inter',sans-serif] text-[20px] font-bold text-(--ink-2) tracking-[-0.01em] mb-0.5">
              2.4M
            </strong>
            páginas viradas
          </div>
        </div>
      </div>

      <div className="relative h-95 flex items-center justify-center">
        <div className="relative w-[460px] h-90">
          {picked.map((b, idx) => (
            <BookCover
              key={b.id + seed}
              book={b}
              size="lg"
              style={BOOK_POSITIONS[idx]}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
