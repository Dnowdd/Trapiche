import BookCover from "@/components/shared/book-cover";
import { BOOK_DETAIL } from "../mock-book";

const Related = () => {
  return (
    <section className="mt-14" data-screen-label="08 Relacionados">
      <div className="flex items-end justify-between mb-5.5">
        <div>
          <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
            Leituras vizinhas
          </div>
          <h2 className="m-0 text-[24px] font-bold tracking-[-0.015em] text-(--ink)">
            Quem leu esse, leu também
          </h2>
        </div>
        <a
          className="text-[12px] text-(--ink-3) border-b border-(--ink-4) hover:text-(--ink)"
          href="#"
        >
          Ver mais →
        </a>
      </div>
      <div className="grid grid-cols-5 gap-4.5">
        {BOOK_DETAIL.related.map((b, i) => (
          <div
            className="flex flex-col gap-2 cursor-pointer transition-transform duration-120 hover:-translate-y-0.5"
            key={i}
          >
            <BookCover
              book={b}
              size="md"
              style={{ width: "100%", aspectRatio: "2/3" }}
            />
            <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight">
              {b.title}
            </div>
            <div className="text-[11px] text-(--ink-4)">{b.author}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Related;
