"use client";

import BookCover from "@/components/shared/book-cover";
import { DIARY_ENTRIES, HEATMAPS, STATS } from "../mock-profile";
import { useState } from "react";

const levelClass: Record<string, string> = {
  l0: "bg-[rgba(67,62,18,0.05)]",
  l1: "bg-[#fff1a8]",
  l2: "bg-[#f5dd5c]",
  l3: "bg-[#d7b937]",
  l4: "bg-[#8a6e1e]",
  future: "bg-transparent border border-dashed border-[rgba(67,62,18,0.1)]",
};

const DiaryStats = () => {
  const ty = STATS.thisYear;
  const ly = STATS.lastYear;

  return (
    <div className="grid grid-cols-4 gap-4.5 mb-5.5">
      <div className="bg-(--ink-2) text-(--cream) border border-(--ink-2) rounded-[18px] py-5 px-[22px] flex flex-col gap-1.5 relative min-h-[124px]">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--cream-deep)">
          2026 · este ano
        </div>
        <div className="text-[40px] font-extrabold tracking-[-0.025em] leading-none">
          {ty.books}
          <span className="text-[14px] font-medium ml-1 text-(--cream-deep)">
            {" "}
            livros
          </span>
        </div>
        <div className="self-start font-mono text-[10px] py-px px-1.5 rounded-[3px] tracking-[0.04em] bg-[rgba(255,231,103,0.15)] text-(--cream-deep) mt-0.5">
          ▾ {Math.round((1 - ty.books / ly.books) * 100)}% vs. 2025
        </div>
        <div className="text-[12px] text-(--cream-deep) leading-[1.4] mt-auto">
          {ty.pages.toLocaleString("pt-BR")} páginas · {ty.hours}h totais
        </div>
      </div>

      <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-5 px-[22px] flex flex-col gap-1.5 relative min-h-[124px]">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
          Média diária
        </div>
        <div className="text-[40px] font-extrabold tracking-[-0.025em] leading-none">
          {ty.avgPerDay}
          <span className="text-[14px] font-medium ml-1 text-(--ink-4)">
            {" "}
            min/dia
          </span>
        </div>
        <div className="self-start font-mono text-[10px] py-px px-1.5 rounded-[3px] tracking-[0.04em] bg-[rgba(67,62,18,0.08)] text-(--ink-3) mt-0.5">
          era {ly.avgPerDay} min em {ly.year}
        </div>
        <div className="text-[12px] text-(--ink-4) leading-[1.4] mt-auto">
          {ty.avgPerBook} dias em média por livro
        </div>
      </div>

      <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-5 px-[22px] flex flex-col gap-1.5 relative min-h-[124px]">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
          Sequência
        </div>
        <div className="text-[40px] font-extrabold tracking-[-0.025em] leading-none">
          {STATS.streak}
          <span className="text-[14px] font-medium ml-1 text-(--ink-4)">
            {" "}
            dias seguidos
          </span>
        </div>
        <div className="self-start font-mono text-[10px] py-px px-1.5 rounded-[3px] tracking-[0.04em] bg-[rgba(67,62,18,0.08)] text-(--ink-3) mt-0.5">
          recorde: {STATS.longestStreak} dias em 2025
        </div>
        <div className="text-[12px] text-(--ink-4) leading-[1.4] mt-auto">
          Dia mais cheio: {STATS.busiest.day}, média {STATS.busiest.avg} min
        </div>
      </div>

      <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-5 px-[22px] flex flex-col gap-1.5 relative min-h-[124px]">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
          Extremos
        </div>
        <div
          className="text-[40px] font-extrabold tracking-[-0.025em] leading-none"
          style={{ fontSize: 24 }}
        >
          {STATS.fastestBook.book.title}
        </div>
        <div
          className="text-[12px] text-(--ink-4) leading-[1.4] mt-auto"
          style={{ marginTop: 4 }}
        >
          ⚡ Mais rápido:{" "}
          <strong style={{ color: "var(--ink-2)" }}>
            {STATS.fastestBook.days} dias
          </strong>
          <br />
          🐢 Mais lento:{" "}
          <strong style={{ color: "var(--ink-2)" }}>
            {STATS.slowestBook.book.title} ({STATS.slowestBook.days}d)
          </strong>
        </div>
      </div>
    </div>
  );
};

type HeatmapDay = { date: Date; minutes: number; future?: boolean } | null;

function levelFor(minutes: number) {
  if (minutes === 0) return "l0";
  if (minutes < 30) return "l1";
  if (minutes < 75) return "l2";
  if (minutes < 130) return "l3";
  return "l4";
}

const Heatmap = ({
  year,
  setYear,
  years,
  days,
}: {
  year: number;
  setYear: (year: number) => void;
  years: number[];
  days: HeatmapDay[];
}) => {
  const cols = [];
  for (let i = 0; i < days.length; i += 7) {
    cols.push(days.slice(i, i + 7));
  }

  const total = days.reduce((s, d) => s + (d?.minutes || 0), 0);
  const totalDays = days.filter((d) => d && d.minutes > 0).length;
  const hours = Math.round(total / 60);

  const monthLabels = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const cellBase =
    "w-[13px] h-[13px] rounded-[2px] cursor-pointer transition-transform duration-100 relative hover:scale-[1.4] hover:z-[2]";

  return (
    <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-6 px-7 mb-5.5">
      <div className="flex justify-between items-center mb-4.5">
        <div>
          <h3 className="m-0 text-[16px] font-bold text-(--ink)">
            Diário de leitura — {year}
          </h3>
          <div
            style={{
              fontSize: 11,
              fontFamily: "JetBrains Mono, monospace",
              color: "var(--ink-4)",
              letterSpacing: "0.04em",
              marginTop: 4,
            }}
          >
            {totalDays} dias de leitura · {hours}h totais
          </div>
        </div>
        <div className="flex gap-1.5 bg-[rgba(67,62,18,0.04)] p-[3px] rounded-md">
          {years.map((y) => (
            <button
              key={y}
              className="font-mono text-[11px] py-1.5 px-3 rounded text-(--ink-3) tracking-[0.04em] transition-colors duration-[120ms] aria-pressed:bg-(--ink-2) aria-pressed:text-(--yellow)"
              aria-pressed={y === year}
              onClick={() => setYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex mb-1.5 pl-[22px] font-mono text-[10px] text-(--ink-4) tracking-[0.04em]">
          {monthLabels.map((m) => (
            <span key={m} className="w-[calc((13px+3px)*4.33)] shrink-0">
              {m}
            </span>
          ))}
        </div>
        <div className="flex">
          <div className="flex flex-col gap-[3px] font-mono text-[9px] text-(--ink-5) mr-2 pt-0.5 w-3.5">
            <span className="h-[13px] leading-[13px]"></span>
            <span className="h-[13px] leading-[13px]">seg</span>
            <span className="h-[13px] leading-[13px]"></span>
            <span className="h-[13px] leading-[13px]">qua</span>
            <span className="h-[13px] leading-[13px]"></span>
            <span className="h-[13px] leading-[13px]">sex</span>
            <span className="h-[13px] leading-[13px]"></span>
          </div>
          <div className="flex gap-[3px] items-start">
            {cols.map((col, ci) => (
              <div className="flex flex-col gap-[3px]" key={ci}>
                {col.map((d, di) => {
                  if (!d)
                    return (
                      <div
                        key={di}
                        className={`${cellBase} ${levelClass.l0}`}
                        style={{ visibility: "hidden" }}
                      ></div>
                    );
                  if (d.future)
                    return (
                      <div
                        key={di}
                        className={`${cellBase} ${levelClass.future}`}
                      ></div>
                    );
                  const lvl = levelFor(d.minutes);
                  const dateStr = d.date.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  });
                  return (
                    <div
                      key={di}
                      className={`${cellBase} ${levelClass[lvl]}`}
                      title={`${dateStr} · ${d.minutes} min`}
                    ></div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 font-mono text-[10px] text-(--ink-4) tracking-[0.04em]">
        <span>cada quadrado = um dia · cor por minutos lidos</span>
        <div className="flex gap-1.5 items-center">
          <span style={{ marginRight: 6 }}>menos</span>
          <div
            className={`w-[11px] h-[11px] rounded-[2px] cursor-default ${levelClass.l0}`}
          ></div>
          <div
            className={`w-[11px] h-[11px] rounded-[2px] cursor-default ${levelClass.l1}`}
          ></div>
          <div
            className={`w-[11px] h-[11px] rounded-[2px] cursor-default ${levelClass.l2}`}
          ></div>
          <div
            className={`w-[11px] h-[11px] rounded-[2px] cursor-default ${levelClass.l3}`}
          ></div>
          <div
            className={`w-[11px] h-[11px] rounded-[2px] cursor-default ${levelClass.l4}`}
          ></div>
          <span style={{ marginLeft: 6 }}>mais</span>
        </div>
      </div>
    </div>
  );
};

const DiaryEntries = () => {
  return (
    <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-6 px-7">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-0.5">
            Últimas entradas
          </div>
          <h3 className="m-0 text-[16px] font-bold tracking-[-0.005em] text-(--ink)">
            Linha do tempo
          </h3>
        </div>
        <a
          className="text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink)"
          href="#"
        >
          + Nova entrada
        </a>
      </div>
      {DIARY_ENTRIES.map((e, i) => (
        <div
          className="grid grid-cols-[130px_60px_1fr_auto] gap-[22px] items-center py-3.5 border-b border-(--rule) last:border-b-0"
          key={i}
        >
          <div className="font-mono text-[11px] text-(--ink-3) tracking-[0.04em] uppercase">
            {e.date}
          </div>
          <div className="[&_.cover-title]:text-[8px] [&_.cover-title]:leading-[1.05] [&_.cover-pub]:hidden [&_.cover-author]:hidden [&_.cover-top]:hidden">
            <BookCover
              book={e.book}
              size="sm"
              style={{ width: 44, height: 64, padding: "5px", borderRadius: 3 }}
            />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-(--ink-2) tracking-[-0.005em]">
              {e.book.title}
            </div>
            {e.note && (
              <div className="text-[12px] text-(--ink-4) leading-[1.4] italic mt-1">
                &quot;{e.note}&quot;
              </div>
            )}
          </div>
          <div className="text-right font-mono text-[11px] text-(--ink-3) tracking-[0.04em] flex flex-col gap-1 [&_strong]:text-(--ink) [&_strong]:text-[16px] [&_strong]:font-bold [&_strong]:font-['Inter',sans-serif] [&_strong]:tracking-[-0.01em]">
            <div>
              <strong>{e.pages}</strong> pgs
            </div>
            <div>{e.minutes} min</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DiarioTab = () => {
  const [year, setYear] = useState(2026);
  const years = Object.keys(HEATMAPS)
    .map(Number)
    .sort((a, b) => b - a);
  const heatmap = HEATMAPS[year as keyof typeof HEATMAPS];

  return (
    <>
      <DiaryStats />
      <Heatmap year={year} setYear={setYear} years={years} days={heatmap} />
      <DiaryEntries />
    </>
  );
};

export default DiarioTab;
