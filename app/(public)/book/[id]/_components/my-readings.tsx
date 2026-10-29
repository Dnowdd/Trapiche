"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import ReadingDatesModal from "@/components/reading/reading-dates-modal";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { deleteReading } from "@/lib/actions/shelf";
import type { BookPageData } from "@/lib/queries/book";
import { SectionHeader } from "./section-header";

type Reading = NonNullable<BookPageData["viewer"]>["readings"][number];

const iconButton =
  "w-8 h-8 rounded-lg flex items-center justify-center text-(--ink-3) cursor-pointer transition-colors duration-120 hover:bg-(--yellow-soft) hover:text-(--ink) disabled:cursor-wait";

function period(r: Reading) {
  if (!r.started && !r.ended) return "Sem datas";
  if (r.status === "ABANDONED")
    return r.started ? `Começou em ${r.started}` : `Parou em ${r.ended}`;
  if (r.started && r.ended) return `${r.started} → ${r.ended}`;
  return r.ended ? `Terminou em ${r.ended}` : `Começou em ${r.started}`;
}

export default function MyReadings({
  data,
  today,
}: {
  data: BookPageData;
  today: string;
}) {
  const [modal, setModal] = useState<"add" | Reading | null>(null);
  const { pending, run } = useAction();
  const v = data.viewer;
  if (!v) return null;
  const show =
    v.readings.length > 0 || v.status === "READ" || v.status === "REREADING";
  if (!show) return null;

  const remove = (r: Reading) => {
    const last =
      v.readings.filter((x) => x.status === "FINISHED").length === 1 &&
      r.status === "FINISHED";
    const warning = last
      ? "Apagar essa leitura? Era a única concluída, então o livro sai de “Lido”."
      : "Apagar essa leitura?";
    if (!window.confirm(warning)) return;
    run(
      () => deleteReading(r.id),
      () => toast("Leitura apagada."),
      toast,
    );
  };

  return (
    <section data-screen-label="Suas leituras">
      <SectionHeader
        eyebrow="Seu histórico"
        title={
          v.readings.length === 1
            ? "Você leu 1 vez"
            : `Suas leituras (${v.readings.length})`
        }
        action={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] border border-[rgba(67,62,18,0.18)] text-[12px] font-medium text-(--ink-2) cursor-pointer hover:bg-(--yellow-soft)"
            onClick={() => setModal("add")}
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar leitura anterior
          </button>
        }
      />

      {v.readings.length === 0 ? (
        <p className="m-0 text-[13px] text-(--ink-4)">
          Nenhuma leitura registrada ainda.
        </p>
      ) : (
        <ol className="m-0 p-0 list-none bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[14px] px-4">
          {v.readings.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 py-3 border-b border-(--rule) last:border-b-0"
            >
              <span className="w-9 shrink-0 font-mono text-[11px] text-(--ink-4)">
                {r.number}ª
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-(--ink-2) truncate">
                  {period(r)}
                </div>
                <div className="text-[12px] text-(--ink-4)">
                  {r.status === "ABANDONED"
                    ? "Abandonada"
                    : r.days
                      ? `Lido em ${r.days} ${r.days === 1 ? "dia" : "dias"}`
                      : "Concluída"}
                </div>
              </div>
              <button
                type="button"
                className={iconButton}
                aria-label={`Editar ${r.number}ª leitura`}
                title="Editar datas"
                onClick={() => setModal(r)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className={iconButton}
                aria-label={`Apagar ${r.number}ª leitura`}
                title="Apagar"
                disabled={pending}
                onClick={() => remove(r)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ol>
      )}

      {modal === "add" && (
        <ReadingDatesModal
          open
          onOpenChange={(o) => !o && setModal(null)}
          mode="add"
          bookId={data.book.id}
          title={data.book.title}
          today={today}
        />
      )}
      {modal && modal !== "add" && (
        <ReadingDatesModal
          key={modal.id}
          open
          onOpenChange={(o) => !o && setModal(null)}
          mode="edit"
          readingId={modal.id}
          number={modal.number}
          abandoned={modal.status === "ABANDONED"}
          startedAt={modal.startedPartial}
          endedAt={modal.endedPartial}
          title={data.book.title}
          today={today}
        />
      )}
    </section>
  );
}
