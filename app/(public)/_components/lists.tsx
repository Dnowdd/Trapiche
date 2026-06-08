import { type CSSProperties } from "react";
import BookCover from "@/components/shared/book-cover";
import { getLists } from "@/app/catalog";

const STACK_POSITIONS: CSSProperties[] = [
  {
    position: "absolute",
    width: 90,
    height: 130,
    bottom: 14,
    left: "22%",
    borderRadius: 3,
    transform: "translateX(-50%) rotate(-7deg)",
    zIndex: 1,
    boxShadow: "0 10px 16px -8px rgba(67,62,18,0.45)",
  },
  {
    position: "absolute",
    width: 90,
    height: 130,
    bottom: 14,
    left: "50%",
    borderRadius: 3,
    transform: "translateX(-50%) rotate(0)",
    zIndex: 3,
    boxShadow: "0 10px 16px -8px rgba(67,62,18,0.45)",
  },
  {
    position: "absolute",
    width: 90,
    height: 130,
    bottom: 14,
    left: "78%",
    borderRadius: 3,
    transform: "translateX(-50%) rotate(7deg)",
    zIndex: 2,
    boxShadow: "0 10px 16px -8px rgba(67,62,18,0.45)",
  },
];

const Lists = async () => {
  const lists = await getLists();

  return (
    <section className="px-12.5" data-screen-label="04 Listas">
      <div className="flex items-end justify-between px-7.5 pb-4">
        <div>
          <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
            Suas estantes
          </div>

          <h2 className="m-0 text-[22px] font-bold text-(--ink-2) tracking-[-0.01em]">
            As listas do Trapiche
          </h2>
        </div>

        <a
          className="text-[12px] text-(--ink-3) font-medium border-b border-(--ink-4) pb-px transition-colors duration-150 hover:text-(--ink)"
          href="#"
        >
          Ver todas →
        </a>
      </div>

      <div className="grid grid-cols-4 gap-4.5 px-7.5">
        {lists.map((l, i) => (
          <div
            className="bg-(--cream-card) border border-[rgba(67,62,18,0.08)] rounded-[18px] p-4.5 pb-5 flex flex-col gap-3.5 transition-[transform,box-shadow] duration-180 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(67,62,18,0.04),0_24px_60px_-28px_rgba(67,62,18,0.3)]"
            key={i}
          >
            <div className="h-40 relative bg-(--yellow-soft) rounded-[10px] overflow-hidden">
              {l.books.map((b, j) => (
                <BookCover
                  key={j}
                  book={b}
                  size="sm"
                  style={STACK_POSITIONS[j]}
                />
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">
                {l.kind} · {l.count} livros
              </div>

              <div className="text-[16px] font-bold text-(--ink-2) tracking-[-0.01em] leading-[1.2]">
                {l.title}
              </div>

              <div className="text-[12px] text-(--ink-4) mt-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-(--cream-deep) border border-(--ink-3) text-[8px] font-bold flex items-center justify-center text-(--ink-2)">
                  {l.byInitials}
                </span>
                Por {l.by}
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-[18px] flex flex-col gap-3.5 transition-[transform,box-shadow,background,border-color] duration-180 cursor-pointer bg-transparent border-[1.5px] border-dashed border-[rgba(67,62,18,0.25)] items-center justify-center text-center min-h-62 hover:bg-(--yellow-soft) hover:border-(--ink-3)">
          <div>
            <div className="text-[32px] font-light text-(--ink-3) mb-2">+</div>

            <div className="text-[13px] text-(--ink-3) font-medium">
              Criar nova estante
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Lists;
