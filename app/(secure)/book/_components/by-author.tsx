import { BOOK_DETAIL } from "../mock-book";

const ByAuthor = () => {
  return (
    <section className="mt-14" data-screen-label="09 Por autor">
      <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-6.5 px-7.5 grid grid-cols-[220px_1fr] gap-7.5 items-center">
        <div>
          <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
            Mesmo autor
          </div>
          <h3 className="m-0 text-[22px] font-bold text-(--ink) tracking-[-0.015em]">
            Mais de Jorge Amado
          </h3>
          <div className="mt-1.5 text-[13px] text-(--ink-4)">
            10 livros catalogados no Trapiche
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {BOOK_DETAIL.by_author.map((t, i) => (
            <div
              className="flex justify-between text-[14px] py-2 border-b border-(--rule) last:border-b-0"
              key={i}
            >
              <span className="text-(--ink-2) font-medium">{t.title}</span>
              <span className="font-mono text-[11px] text-(--ink-4) tracking-[0.04em]">
                {t.year}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ByAuthor;
