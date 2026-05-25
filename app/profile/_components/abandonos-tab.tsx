import BookCover from "@/components/shared/book-cover";
import { useState } from "react";
import { ABANDONOS } from "../mock-profile";
import Chips from "@/components/shared/chips";

const AbandonosTab = () => {
  const [sort, setSort] = useState("recente");
  const items = [...ABANDONOS].sort((a, b) => {
    if (sort === "avancados") return b.percent - a.percent;
    if (sort === "tempo") return b.spentDays - a.spentDays;
    return 0;
  });

  return (
    <>
      <div className="bg-(--cream-card) border-l-[3px] border-l-(--ink-3) rounded-[0_8px_8px_0] py-4 px-[22px] mb-5.5 text-[13px] text-(--ink-3) leading-[1.5] max-w-[720px] [&_strong]:text-(--ink-2) [&_strong]:font-semibold">
        <strong>Sem culpa.</strong> Abandonar também é leitura. Aqui ficam os
        livros que você começou e não terminou — alguns vão voltar para a pilha,
        outros não, e está tudo bem.
      </div>

      <Chips
        label="Ordem"
        value={sort}
        onChange={setSort}
        options={[
          { id: "recente", label: "Mais recente" },
          { id: "avancados", label: "Mais avançados" },
          { id: "tempo", label: "Mais tempo passado" },
        ]}
      />

      <div className="flex flex-col gap-4">
        {items.map((a, i) => (
          <article className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-[22px] px-[26px] grid grid-cols-[100px_1fr_auto] gap-6 items-center" key={i}>
            <BookCover book={a.book} size="md" style={{ width: 100, height: 150 }} />
            <div className="min-w-0">
              <div className="text-[17px] font-bold text-(--ink) tracking-[-0.01em]">{a.book.title}</div>
              <div className="text-[12px] text-(--ink-4) mt-[3px]">{a.book.author}</div>
              <div className="mt-3.5 flex items-center gap-2.5 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] [&_strong]:text-(--ink-2) [&_strong]:font-['Inter',sans-serif] [&_strong]:font-bold [&_strong]:text-[12px]">
                <div className="flex-1 max-w-[280px] h-[5px] rounded-[3px] bg-[rgba(67,62,18,0.1)] overflow-hidden relative">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-(--ink-3) rounded-[3px] after:content-[''] after:absolute after:-right-[3px] after:-top-[3px] after:w-[11px] after:h-[11px] after:bg-(--ink-3) after:border-2 after:border-(--cream-card) after:rounded-full"
                    style={{ width: a.percent + "%" }}
                  ></div>
                </div>
                <span>
                  parou em <strong>{a.percent}%</strong> · pág. {a.page} de{" "}
                  {a.total}
                </span>
              </div>
              {a.reason && (
                <div className="mt-3.5 text-[13px] text-(--ink-3) italic leading-[1.5] border-l-2 border-(--rule) pl-3 max-w-[560px]">
                  &quot;{a.reason}&quot;
                </div>
              )}
            </div>
            <div className="text-right flex flex-col items-end gap-2.5">
              <span className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase">{a.abandonedAt}</span>
              <span className="text-[12px] text-(--ink-3) [&_strong]:text-(--ink) [&_strong]:font-semibold">
                depois de <strong>{a.spentDays} dias</strong>
              </span>
              {a.again ? (
                <button className="text-[11px] py-1.5 px-3 border border-(--ink-3) rounded-md text-(--ink-2) font-medium hover:bg-(--yellow-soft)">
                  ↺ Voltar à pilha
                </button>
              ) : (
                <span className="font-mono text-[10px] py-[3px] px-2 rounded bg-[rgba(67,62,18,0.06)] text-(--ink-4) tracking-[0.04em] uppercase">
                  não pretendo
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
};

export default AbandonosTab;
