"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import LogSessionModal, {
  type ReadingOption,
} from "@/components/reading/log-session-modal";
import type { getDiario } from "@/lib/queries/profile";

type Data = Awaited<ReturnType<typeof getDiario>>;

const levelClass: Record<string, string> = {
  l0: "bg-[rgba(67,62,18,0.05)]",
  l1: "bg-[#fff1a8]",
  l2: "bg-[#f5dd5c]",
  l3: "bg-[#d7b937]",
  l4: "bg-[#8a6e1e]",
  future: "bg-transparent border border-dashed border-[rgba(67,62,18,0.1)]",
};

const MONTHS = [
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
const MONTHS_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function levelFor(minutes: number) {
  if (minutes === 0) return "l0";
  if (minutes < 30) return "l1";
  if (minutes < 75) return "l2";
  if (minutes < 130) return "l3";
  return "l4";
}

const statCard =
  "bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-5 px-5.5 flex flex-col gap-1.5 relative min-h-31";
const badge =
  "self-start font-mono text-[10px] py-px px-1.5 rounded-[3px] tracking-[0.04em] mt-0.5";

function DiaryStats({ data }: { data: Data }) {
  const ty = data.thisYear;
  const ly = data.lastYear;
  const diff =
    ly.books > 0 ? Math.round(((ty.books - ly.books) / ly.books) * 100) : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4.5 mb-5.5">
      <div className="bg-(--ink-2) text-(--cream) border border-(--ink-2) rounded-[18px] py-5 px-5.5 flex flex-col gap-1.5 relative min-h-31">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--cream-deep)">
          {ty.year} · este ano
        </div>
        <div className="text-[40px] font-extrabold tracking-[-0.025em] leading-none">
          {ty.books}
          <span className="text-[14px] font-medium ml-1 text-(--cream-deep)">
            {ty.books === 1 ? "livro" : "livros"}
          </span>
        </div>
        {diff != null && (
          <div
            className={`${badge} bg-[rgba(255,231,103,0.15)] text-(--cream-deep)`}
          >
            {diff >= 0 ? "▴" : "▾"} {Math.abs(diff)}% vs. {ly.year}
          </div>
        )}
        <div className="text-[12px] text-(--cream-deep) leading-[1.4] mt-auto">
          {ty.pages.toLocaleString("pt-BR")} páginas · {ty.hours}h totais
        </div>
      </div>

      <div className={statCard}>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
          Média diária
        </div>
        <div className="text-[40px] font-extrabold tracking-[-0.025em] leading-none">
          {ty.avgPerDay}
          <span className="text-[14px] font-medium ml-1 text-(--ink-4)">
            min/dia
          </span>
        </div>
        {ly.avgPerDay > 0 && (
          <div className={`${badge} bg-[rgba(67,62,18,0.08)] text-(--ink-3)`}>
            era {ly.avgPerDay} min em {ly.year}
          </div>
        )}
        <div className="text-[12px] text-(--ink-4) leading-[1.4] mt-auto">
          {ty.avgPerBook != null
            ? `${ty.avgPerBook} ${ty.avgPerBook === 1 ? "dia" : "dias"} em média por livro`
            : "Termine um livro para ver a média por livro"}
        </div>
      </div>

      <div className={statCard}>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
          Sequência
        </div>
        <div className="text-[40px] font-extrabold tracking-[-0.025em] leading-none">
          {data.streak}
          <span className="text-[14px] font-medium ml-1 text-(--ink-4)">
            {data.streak === 1 ? "dia seguido" : "dias seguidos"}
          </span>
        </div>
        {data.record.length > 0 && (
          <div className={`${badge} bg-[rgba(67,62,18,0.08)] text-(--ink-3)`}>
            recorde: {data.record.length}{" "}
            {data.record.length === 1 ? "dia" : "dias"} em {data.record.year}
          </div>
        )}
        <div className="text-[12px] text-(--ink-4) leading-[1.4] mt-auto">
          {data.busiest
            ? `Dia mais cheio: ${data.busiest.day}, média ${data.busiest.avg} min`
            : "Registre leituras para ver seu ritmo"}
        </div>
      </div>

      <div className={statCard}>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
          Extremos
        </div>
        {data.fastest ? (
          <>
            <div className="text-[24px] font-extrabold tracking-[-0.025em] leading-[1.1]">
              {data.fastest.title}
            </div>
            <div className="text-[12px] text-(--ink-4) leading-[1.4] mt-auto [&_strong]:text-(--ink-2)">
              ⚡ Mais rápido:{" "}
              <strong>
                {data.fastest.days} {data.fastest.days === 1 ? "dia" : "dias"}
              </strong>
              {data.slowest && (
                <>
                  <br />
                  🐢 Mais lento:{" "}
                  <strong>
                    {data.slowest.title} ({data.slowest.days}d)
                  </strong>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="text-[12px] text-(--ink-4) leading-[1.4] mt-auto">
            Termine livros para ver o mais rápido e o mais lento.
          </div>
        )}
      </div>
    </div>
  );
}

type Day = { iso: string; date: Date; minutes: number; future: boolean } | null;

function buildDays(
  year: number,
  minutesByDay: Record<string, number>,
  today: string,
) {
  const days: Day[] = [];
  const start = new Date(Date.UTC(year, 0, 1));
  for (let i = 0; i < start.getUTCDay(); i++) days.push(null);
  for (
    let d = start;
    d.getUTCFullYear() === year;
    d = new Date(d.getTime() + 86_400_000)
  ) {
    const iso = d.toISOString().slice(0, 10);
    days.push({
      iso,
      date: d,
      minutes: minutesByDay[iso] ?? 0,
      future: iso > today,
    });
  }
  return days;
}

function Heatmap({ data }: { data: Data }) {
  const [year, setYear] = useState(data.years[0]);
  const days = useMemo(
    () => buildDays(year, data.minutesByDay, data.today),
    [year, data.minutesByDay, data.today],
  );
  const cols: Day[][] = [];
  for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));
  const total = days.reduce((s, d) => s + (d?.minutes ?? 0), 0);
  const totalDays = days.filter((d) => d && d.minutes > 0).length;
  const cellBase =
    "w-3.25 h-3.25 rounded-[2px] transition-transform duration-100 relative hover:scale-[1.4] hover:z-2";
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [year]);

  return (
    <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-5 sm:p-6 sm:px-7 mb-5.5">
      <div className="flex justify-between items-center mb-4.5">
        <div>
          <h3 className="m-0 text-[16px] font-bold text-(--ink)">
            Diário de leitura — {year}
          </h3>
          <div className="mt-1 font-mono text-[11px] text-(--ink-4) tracking-[0.04em]">
            {totalDays} {totalDays === 1 ? "dia" : "dias"} de leitura ·{" "}
            {Math.round(total / 60)}h totais
          </div>
        </div>
        {data.years.length > 1 && (
          <div className="flex gap-1.5 bg-[rgba(67,62,18,0.04)] p-0.75 rounded-md">
            {data.years.map((y) => (
              <button
                key={y}
                className="font-mono text-[11px] py-1.5 px-3 rounded text-(--ink-3) tracking-[0.04em] cursor-pointer transition-colors duration-120 aria-pressed:bg-(--ink-2) aria-pressed:text-(--yellow)"
                aria-pressed={y === year}
                onClick={() => setYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={scroller} className="overflow-x-auto pb-1">
        <div className="flex mb-1.5 pl-5.5 font-mono text-[10px] text-(--ink-4) tracking-[0.04em]">
          {MONTHS.map((m) => (
            <span key={m} className="w-[calc((13px+3px)*4.33)] shrink-0">
              {m}
            </span>
          ))}
        </div>
        <div className="flex">
          <div className="flex flex-col gap-0.75 font-mono text-[9px] text-(--ink-5) mr-2 pt-0.5 w-3.5">
            {["", "seg", "", "qua", "", "sex", ""].map((d, i) => (
              <span key={i} className="h-3.25 leading-3.25">
                {d}
              </span>
            ))}
          </div>
          <div className="flex gap-0.75 items-start">
            {cols.map((col, ci) => (
              <div className="flex flex-col gap-0.75" key={ci}>
                {col.map((d, di) => {
                  if (!d)
                    return <div key={di} className={`${cellBase} invisible`} />;
                  if (d.future)
                    return (
                      <div
                        key={di}
                        className={`${cellBase} ${levelClass.future}`}
                      />
                    );
                  const label = `${d.date.getUTCDate()} ${MONTHS_SHORT[d.date.getUTCMonth()]} · ${d.minutes} min`;
                  return (
                    <div
                      key={di}
                      className={`${cellBase} ${levelClass[levelFor(d.minutes)]}`}
                      title={label}
                      aria-label={label}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-between items-center mt-4 font-mono text-[10px] text-(--ink-4) tracking-[0.04em]">
        <span>cada quadrado = um dia · cor por minutos lidos</span>
        <div className="flex gap-1.5 items-center">
          <span className="mr-1.5">menos</span>
          {["l0", "l1", "l2", "l3", "l4"].map((l) => (
            <div
              key={l}
              className={`w-2.75 h-2.75 rounded-[2px] ${levelClass[l]}`}
            />
          ))}
          <span className="ml-1.5">mais</span>
        </div>
      </div>
    </div>
  );
}

export default function DiarioTab({
  data,
  isOwner,
  handle,
  limit,
  readingBooks,
}: {
  data: Data;
  isOwner: boolean;
  handle: string;
  limit: number;
  readingBooks: ReadingOption[];
}) {
  const [logging, setLogging] = useState(false);

  return (
    <>
      <DiaryStats data={data} />
      <Heatmap data={data} />
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
          {isOwner && (
            <button
              type="button"
              className="text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px cursor-pointer hover:text-(--ink)"
              onClick={() => setLogging(true)}
            >
              + Nova entrada
            </button>
          )}
        </div>
        {data.entries.length === 0 ? (
          <p className="m-0 text-[13px] text-(--ink-4)">
            {isOwner
              ? "Nenhuma entrada ainda. Registre sua leitura do dia em “+ Nova entrada” ou na página do livro."
              : "Nenhuma entrada no diário ainda."}
          </p>
        ) : (
          data.entries.map((e) => (
            <div
              className="grid grid-cols-[44px_1fr_auto] sm:grid-cols-[130px_60px_1fr_auto] gap-3 sm:gap-5.5 items-center py-3.5 border-b border-(--rule) last:border-b-0"
              key={e.id}
            >
              <div className="hidden sm:block font-mono text-[11px] text-(--ink-3) tracking-[0.04em] uppercase">
                {e.date}
              </div>
              <Link
                href={`/book/${e.book.id}`}
                className="[&_.cover-title]:text-[8px] [&_.cover-title]:leading-[1.05] [&_.cover-pub]:hidden [&_.cover-author]:hidden [&_.cover-top]:hidden"
              >
                <BookCover
                  book={e.book}
                  size="sm"
                  style={{
                    width: 44,
                    height: 64,
                    padding: "5px",
                    borderRadius: 3,
                  }}
                />
              </Link>
              <div className="min-w-0">
                <Link
                  href={`/book/${e.book.id}`}
                  className="text-[14px] font-semibold text-(--ink-2) tracking-[-0.005em] hover:underline"
                >
                  {e.book.title}
                </Link>
                <div className="sm:hidden mt-0.5 font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">
                  {e.date}
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
          ))
        )}
        {data.entriesTotal > data.entries.length && (
          <div className="pt-4 text-center">
            <Link
              href={`/u/${handle}?tab=diario&entradas=${limit + 40}`}
              scroll={false}
              className="text-[12px] text-(--ink-3) border-b border-(--ink-4) hover:text-(--ink)"
            >
              Ver mais entradas ({data.entriesTotal - data.entries.length})
            </Link>
          </div>
        )}
      </div>
      {logging && (
        <LogSessionModal
          open
          onOpenChange={setLogging}
          books={readingBooks}
          today={data.today}
        />
      )}
    </>
  );
}
