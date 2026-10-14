import { BOOK_DETAIL } from "../mock-book";

const fillColor: Record<number, string> = {
  5: "bg-(--ink-2)",
  4: "bg-(--ink-3)",
  3: "bg-(--yellow-deep)",
  2: "bg-(--ink-4)",
  1: "bg-(--ink-5)",
};

const RatingBlock = () => {
  const r = BOOK_DETAIL.rating;
  const total = Object.values(r.distribution).reduce((a, b) => a + b, 0);

  return (
    <section className="mt-14" data-screen-label="04 Avaliacao geral">
      <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
        No Trapiche
      </div>
      <h2 className="m-0 mb-1.5 text-[24px] font-bold tracking-[-0.015em] text-(--ink)">
        Como a comunidade lê esse livro
      </h2>
      <div className="h-5.5" />
      <div className="grid grid-cols-[220px_1fr] gap-12.5 bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-7.5 px-8.5">
        <div>
          <div className="flex flex-col gap-1">
            <div className="text-[64px] font-extrabold text-(--ink) tracking-[-0.03em] leading-none">
              {r.average}
            </div>
            <div className="font-mono text-[12px] text-(--ink-4) tracking-[0.04em]">
              de 5,0
            </div>
            <div className="text-[22px] text-(--ink-2) tracking-[-1px] mt-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={
                    i < Math.round(r.average)
                      ? ""
                      : "text-[rgba(67,62,18,0.18)]"
                  }
                >
                  ★
                </span>
              ))}
            </div>
            <div className="mt-1.5 text-[13px] text-(--ink-4) [&_strong]:text-(--ink-2) [&_strong]:font-semibold">
              <strong>{r.count.toLocaleString("pt-BR")}</strong> avaliações
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-(--rule) grid grid-cols-2 gap-4.5">
            <div>
              <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase">
                Leitura média
              </div>
              <div className="text-[20px] font-bold text-(--ink-2) tracking-[-0.01em]">
                {r.avgDaysToRead}
                <span className="text-[12px] text-(--ink-4) font-medium ml-1 font-mono">
                  dias
                </span>
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase">
                Listas com esse livro
              </div>
              <div className="text-[20px] font-bold text-(--ink-2) tracking-[-0.01em]">
                312
                <span className="text-[12px] text-(--ink-4) font-medium ml-1 font-mono">
                  públicas
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {[5, 4, 3, 2, 1].map((n) => {
            const v = r.distribution[n as keyof typeof r.distribution];
            const pct = (v / total) * 100;
            return (
              <div
                className="grid grid-cols-[36px_1fr_64px] gap-3.5 items-center"
                key={n}
              >
                <span className="font-mono text-[11px] text-(--ink-3) tracking-[0.04em] flex items-center gap-1">
                  <span className="text-(--ink-2)">{n}</span> ★
                </span>
                <div className="h-2 bg-[rgba(67,62,18,0.06)] rounded-lg overflow-hidden">
                  <div
                    className={`h-full rounded-lg ${fillColor[n]}`}
                    style={{ width: pct + "%" }}
                  />
                </div>
                <span className="font-mono text-[11px] text-(--ink-4) text-right">
                  {v.toLocaleString("pt-BR")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RatingBlock;
