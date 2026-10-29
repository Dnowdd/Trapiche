"use client";

import { useState } from "react";
import LogSessionModal from "@/components/reading/log-session-modal";
import FinishModal from "@/components/reading/finish-modal";
import ProgressModal from "@/components/reading/progress-modal";
import ReviewModal from "@/components/reading/review-modal";
import type { BookPageData } from "@/lib/queries/book";

const ghost =
  "text-[12px] font-medium py-2.25 px-3.5 rounded-[7px] bg-transparent border border-[rgba(255,248,213,0.3)] text-(--cream) cursor-pointer transition-[transform,background] duration-100 hover:bg-[rgba(255,248,213,0.05)] hover:-translate-y-px";

export default function MyReading({
  data,
  today,
}: {
  data: BookPageData;
  today: string;
}) {
  const [modal, setModal] = useState<
    null | "log" | "finish" | "progress" | "review"
  >(null);
  const v = data.viewer;
  const r = v?.reading;
  const book = data.book;
  if (!v) return null;
  const showCard = r && (v.status === "READING" || v.status === "REREADING");

  return (
    <>
      {showCard && (
        <section data-screen-label="02 Sua leitura">
          <div className="bg-(--ink-2) text-(--cream) rounded-[18px] p-6 md:py-7 md:px-8 grid gap-8 xl:grid-cols-[1fr_280px]">
            <div>
              <div className="font-mono text-[11px] text-(--cream-deep) tracking-[0.06em] uppercase">
                {v.status === "REREADING" ? "Sua releitura" : "Sua leitura"}
              </div>
              <h3 className="mt-1.5 mb-4 text-[24px] font-bold text-(--yellow) tracking-[-0.015em]">
                Você está aqui agora
              </h3>

              <div className="text-[56px] font-extrabold text-(--yellow) leading-none tracking-[-0.03em]">
                {r.progress}
                <span className="text-[28px] ml-1 text-(--cream-deep)">%</span>
              </div>
              <div className="mt-1.5 font-mono text-[12px] text-(--cream-deep) tracking-[0.04em]">
                página {r.page}
                {r.total ? ` de ${r.total}` : ""}
              </div>
              <div className="mt-4 h-2 bg-[rgba(255,231,103,0.15)] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-(--yellow) rounded-sm transition-[width] duration-300"
                  style={{ width: r.progress + "%" }}
                />
              </div>

              <div className="mt-4 flex gap-9 flex-wrap">
                {[
                  { value: r.started, label: "Começou em" },
                  { value: r.expectedDone ?? "—", label: "Previsão" },
                  {
                    value: `${r.streakDays} ${r.streakDays === 1 ? "dia" : "dias"}`,
                    label: "Sequência",
                  },
                  ...(r.number > 1
                    ? [{ value: `${r.number}ª vez`, label: "Releitura" }]
                    : []),
                ].map((s) => (
                  <div className="flex flex-col gap-0.5" key={s.label}>
                    <span className="text-[18px] font-bold text-(--cream) tracking-[-0.01em]">
                      {s.value}
                    </span>
                    <span className="font-mono text-[10px] text-(--cream-deep) tracking-[0.06em] uppercase">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {v.note && (
                <div className="mt-3.5 italic text-[13px] text-(--cream-deep) border-l-2 border-[rgba(255,231,103,0.4)] pl-3 leading-normal">
                  &quot;{v.note}&quot;
                </div>
              )}

              <div className="mt-5.5 flex gap-2 flex-wrap">
                <button
                  className="text-[12px] font-medium py-2.25 px-3.5 rounded-[7px] bg-(--yellow) text-(--ink) cursor-pointer transition-transform duration-100 hover:-translate-y-px"
                  onClick={() => setModal("log")}
                >
                  + Registrar leitura de hoje
                </button>
                <button className={ghost} onClick={() => setModal("finish")}>
                  Marcar como concluído
                </button>
                <button className={ghost} onClick={() => setModal("progress")}>
                  Editar progresso
                </button>
              </div>
            </div>

            <div className="bg-[rgba(255,248,213,0.06)] border border-[rgba(255,248,213,0.1)] rounded-[10px] py-4 px-4.5 self-start">
              <div className="font-mono text-[11px] text-(--cream-deep) tracking-[0.06em] uppercase mb-2.5 flex justify-between">
                <span>Últimas sessões</span>
                <span>{r.sessionsCount}</span>
              </div>
              {r.sessions.length === 0 ? (
                <p className="m-0 py-2 text-[12px] text-(--cream-deep) leading-normal">
                  Nenhuma sessão ainda. Registre sua primeira leitura para ver o
                  ritmo, a previsão e a sequência.
                </p>
              ) : (
                r.sessions.map((s) => (
                  <div
                    className="grid grid-cols-[90px_1fr_auto] gap-3 text-[12px] items-center py-1.5 border-b border-[rgba(255,248,213,0.08)] last:border-b-0"
                    key={s.id}
                  >
                    <span className="font-mono text-[10px] text-(--cream-deep) tracking-[0.04em] uppercase">
                      {s.date}
                    </span>
                    <span className="text-(--cream) font-medium [&_strong]:text-(--yellow) [&_strong]:font-bold">
                      <strong>{s.pages} pgs</strong> · até pág. {s.pageEnd}
                    </span>
                    <span className="text-(--cream-deep) font-mono text-[11px]">
                      {s.minutes}min
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {r && modal === "log" && (
        <LogSessionModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          today={today}
          books={[
            {
              id: book.id,
              title: book.title,
              currentPage: v.currentPage,
              pageCount: book.pageCount,
            },
          ]}
          onReachedEnd={() => setModal("finish")}
        />
      )}
      {modal === "finish" && (
        <FinishModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          bookId={book.id}
          title={book.title}
          today={today}
          startedAt={r?.startedPartial}
          onFinished={() => {
            if (!v.review) setModal("review");
          }}
        />
      )}
      {r && modal === "progress" && (
        <ProgressModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          bookId={book.id}
          today={today}
          currentPage={r.page}
          pageCount={book.pageCount}
          startedAt={r.startedISO}
          note={v.note}
        />
      )}
      {modal === "review" && (
        <ReviewModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          bookId={book.id}
          title={book.title}
          eyebrow="Leitura concluída · que tal uma resenha?"
        />
      )}
    </>
  );
}
