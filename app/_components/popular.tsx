import BookCover from "@/components/shared/book-cover";
import { BOOKS } from "../mock";

const Popular = () => {
  const density = 8;
  const list = BOOKS.slice(0, density);

  return (
    <section className="px-12.5" data-screen-label="06 Populares">
      <div className="flex items-end justify-between px-7.5 pb-4">
        <div>
          <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
            Esta semana
          </div>

          <h2 className="m-0 text-[22px] font-bold text-(--ink-2) tracking-[-0.01em]">
            Livros populares no Trapiche
          </h2>
        </div>

        <a
          className="text-[12px] text-(--ink-3) font-medium border-b border-(--ink-4) pb-px transition-colors duration-150 hover:text-(--ink)"
          href="#"
        >
          Ver toda a lista →
        </a>
      </div>

      <div className="px-7.5">
        <div
          className="grid gap-4.5"
          style={{
            gridTemplateColumns: `repeat(${density}, 1fr)`,
          }}
        >
          {list.map((b, i) => {
            const pct =
              [92, 87, 84, 81, 79, 76, 74, 71, 68, 66, 64, 62][i] || 60;
            const reads = 3200 - i * 280;
            return (
              <div className="flex flex-col gap-2.5 cursor-pointer" key={b.id}>
                <BookCover book={b} size="md" />

                <div className="flex justify-between items-center font-mono text-[10px] text-(--ink-4) tracking-[0.04em]">
                  <span>{reads.toLocaleString("pt-BR")} leitoras</span>

                  <span className="text-(--ink-2) font-semibold">{pct}%</span>
                </div>

                <div className="text-[14px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight">
                  {b.title}
                </div>

                <div className="text-[12px] text-(--ink-4) -mt-1">
                  {b.author}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Popular;
