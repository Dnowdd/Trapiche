"use client";

import { ArrowUp, ShipWheel, Sparkles } from "lucide-react";
import { ASSISTANT_NAME } from "@/lib/assistant/config";
import { openPratico } from "./assistant-launcher";

const PROMPTS = [
  {
    label: "O que eu leio depois?",
    prompt: "Olhando o que eu li e gostei, o que você me recomenda ler depois?",
  },
  {
    label: "Como está meu ano de leitura?",
    prompt:
      "Como está meu ano de leitura? Quero os números e o que se destacou.",
  },
  {
    label: "Um livro curto pro fim de semana",
    prompt:
      "Me sugere livros curtos, de até 200 páginas, para ler neste fim de semana.",
  },
];

export default function PraticoHome() {
  return (
    <section
      aria-labelledby="pratico-home-title"
      className="relative overflow-hidden rounded-[18px] bg-[#2b2710] p-5 sm:p-6 text-[#fff8d5] ring-1 ring-[rgba(255,248,213,0.08)]"
    >
      <ShipWheel
        aria-hidden
        strokeWidth={1.4}
        className="pointer-events-none absolute -right-6 -top-6 size-40 text-[#3f3a1a]"
      />

      <div className="relative">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#ffe767]">
          <Sparkles size={12} aria-hidden />
          {ASSISTANT_NAME} · IA de leitura
        </div>
        <h2
          id="pratico-home-title"
          className="m-0 mt-1.5 max-w-md text-[20px] sm:text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-[#fff8d5]"
        >
          Pergunte qualquer coisa sobre os seus livros
        </h2>
        <p className="m-0 mt-1.5 max-w-lg text-[13.5px] leading-relaxed text-[#e9e0b4]">
          Recomendações do seu jeito, o resumo do seu ano, ajuda com resenhas e
          a estante em dia. Nada muda na sua conta sem você confirmar.
        </p>

        <button
          type="button"
          onClick={() => openPratico()}
          className="group mt-4 flex w-full max-w-xl items-center gap-3 rounded-full bg-[rgba(255,248,213,0.08)] py-1.5 pl-4 pr-1.5 text-left ring-1 ring-[rgba(255,248,213,0.16)] cursor-pointer transition-colors hover:bg-[rgba(255,248,213,0.13)]"
        >
          <span className="flex-1 truncate text-[14px] text-[#d8cfa1]">
            Pergunte ao {ASSISTANT_NAME}…
          </span>
          <span className="size-9 shrink-0 rounded-full bg-[#ffe767] text-[#343600] flex items-center justify-center transition-transform group-hover:-translate-y-px">
            <ArrowUp size={17} strokeWidth={2.4} aria-hidden />
          </span>
        </button>

        <div className="mt-3 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => openPratico(p.prompt)}
              className="h-8 rounded-full px-3 text-[12.5px] font-medium text-[#fff8d5] ring-1 ring-[rgba(255,248,213,0.22)] cursor-pointer transition-colors hover:bg-[rgba(255,231,103,0.14)] hover:ring-[rgba(255,231,103,0.5)]"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
