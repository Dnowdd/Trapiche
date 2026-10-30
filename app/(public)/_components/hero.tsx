"use client";

import { type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import BookCover from "@/components/shared/book-cover";
import type { Book } from "@/lib/types/book";

const BOOK_POSITIONS: CSSProperties[] = [
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

interface HeroProps {
  books: Book[];
}

const Hero = ({ books }: HeroProps) => {
  const router = useRouter();

  const picked = books.slice(0, 3);

  return (
    <section
      className="grid gap-6 md:gap-10 md:grid-cols-2 pt-12 md:pt-20 lg:pt-25 px-4 sm:px-8 lg:px-[125px] pb-8 md:pb-[90px] items-center"
      data-screen-label="02 Hero"
    >
      <div>
        <h1 className="m-0 mb-6 text-[40px] sm:text-[52px] lg:text-[64px] font-extrabold leading-[0.98] tracking-[-0.025em] text-(--ink-2)">
          O porto seguro
          <br />
          das suas{" "}
          <span className="whitespace-nowrap">
            <em className="not-italic relative inline-block after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-[0.06em] after:h-[0.32em] after:bg-(--yellow) after:z-[-1] after:[transform:skewX(-6deg)]">
              leituras
            </em>
            .
          </span>
        </h1>

        <p className="m-0 mb-8 max-w-[460px] text-[15px] leading-[1.55] text-(--ink-3)">
          Suas leituras merecem mais do que uma estante silenciosa. No Trapiche,
          a gente celebra quem devora páginas numa ânsia que é quase febre — sem
          ranking, sem rede social, só você e os seus livros.
        </p>

        <div className="flex flex-wrap items-center gap-3.5">
          <button
            className="bg-(--yellow) text-(--ink) py-3 px-5.5 rounded-lg text-[14px] font-semibold inline-flex items-center gap-2 border border-(--yellow-deep) transition-[transform,box-shadow] duration-120 hover:-translate-y-px hover:shadow-[0_6px_16px_-8px_rgba(67,62,18,0.4)]"
            onClick={() => router.push("/auth?mode=register")}
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
          </button>

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
      </div>

      <div className="relative h-72 sm:h-95 flex items-center justify-center overflow-hidden md:overflow-visible">
        <div className="relative w-[460px] h-90 shrink-0 scale-[0.68] sm:scale-90 lg:scale-100">
          {picked.map((b, idx) => (
            <BookCover
              key={b.id}
              book={b}
              size="lg"
              style={BOOK_POSITIONS[idx]}
              loading="eager"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
