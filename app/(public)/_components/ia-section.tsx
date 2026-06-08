import BookCover from "@/components/shared/book-cover";
import { getFeaturedBooks } from "@/app/catalog";
import type { Book } from "@/lib/types/book";

const IASection = async () => {
  const allBooks = await getFeaturedBooks();
  const filled = 3;
  const filledBooks = allBooks.slice(2, 2 + filled);

  return (
    <section className="px-12.5" data-screen-label="05 IA">
      <div className="bg-(--cream-card) rounded-[28px] py-14 px-12.5 flex flex-col items-center gap-9 border border-[rgba(67,62,18,0.06)] shadow-[0_1px_0_rgba(67,62,18,0.04),0_8px_24px_-16px_rgba(67,62,18,0.18)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(255,231,103,0.45),transparent_70%)] pointer-events-none" />

        <div className="text-center flex flex-col items-center gap-3 relative">
          <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.08em] uppercase inline-flex items-center gap-2 py-1.5 px-3 bg-[rgba(67,62,18,0.06)] rounded-full">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z" />
            </svg>
            recomendação por afinidade
          </div>

          <h2 className="m-0 text-[44px] font-extrabold tracking-tight leading-[1.05] text-(--ink-2) max-w-135 text-balance">
            Encontre seu próximo livro favorito.
          </h2>

          <p className="m-0 text-[14px] text-(--ink-3) max-w-115 text-center leading-[1.55]">
            Escolha 5 livros que você ama. A nossa recomendação não usa rankings
            ou listas de mais vendidos — só o seu gosto.
          </p>
        </div>

        <div className="flex gap-3.5 relative">
          {[0, 1, 2, 3, 4].map((i) => {
            const book: Book | undefined = filledBooks[i];
            return (
              <div
                key={i}
                className={
                  book
                    ? "w-32.5 h-48.75 rounded-lg relative flex items-center justify-center"
                    : "w-32.5 h-48.75 rounded-lg relative flex items-center justify-center flex-col gap-2 border-[1.5px] border-dashed border-[rgba(67,62,18,0.25)] bg-[rgba(67,62,18,0.025)] text-(--ink-4) cursor-pointer transition-[background,border-color] duration-150 hover:bg-(--yellow-soft) hover:border-(--ink-3) hover:text-(--ink-2)"
                }
              >
                <span className="absolute -top-2.5 -left-2.5 w-5.5 h-5.5 rounded-full bg-(--ink-2) text-(--yellow) font-mono text-[10px] font-semibold flex items-center justify-center border-2 border-(--cream-card)">
                  {i + 1}
                </span>
                {book ? (
                  <BookCover
                    book={book}
                    size="sm"
                    style={{ width: "100%", height: "100%", borderRadius: 6 }}
                  />
                ) : (
                  <>
                    <span className="font-mono text-[11px] tracking-[0.08em]">
                      0{i + 1}
                    </span>

                    <span className="text-[24px] font-light">+</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 relative">
          <span className="font-mono text-[11px] text-(--ink-4) tracking-[0.04em]">
            <strong className="text-(--ink-2)">{filled}</strong>/5 selecionados
          </span>

          <button
            className="py-3 px-5.5 rounded-lg bg-(--ink-2) text-(--yellow) text-[14px] font-semibold tracking-[-0.005em] inline-flex items-center gap-2 border border-(--ink-2) transition-transform duration-120 disabled:bg-[rgba(67,62,18,0.1)] disabled:text-(--ink-4) disabled:border-transparent disabled:cursor-not-allowed enabled:hover:-translate-y-px"
            disabled={filled < 5}
          >
            Gerar recomendação
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default IASection;
