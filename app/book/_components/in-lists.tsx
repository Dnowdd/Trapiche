import { BOOK_DETAIL } from "../mock-book";

const InLists = () => {
  return (
    <section className="mt-14" data-screen-label="07 Em listas">
      <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">Onde esse livro aparece</div>
      <h2 className="m-0 mb-1.5 text-[24px] font-bold tracking-[-0.015em] text-(--ink)">
        Em {BOOK_DETAIL.in_my_lists.length + BOOK_DETAIL.in_public_lists.length}{" "}
        listas
      </h2>
      <div className="h-5.5" />
      <div className="grid grid-cols-2 gap-7.5">
        <div>
          <div className="font-mono text-[11px] text-(--ink-3) tracking-[0.08em] uppercase mb-3 flex items-center gap-2">
            <span>Suas estantes</span>
            <span className="flex-1 h-px bg-(--rule)" />
          </div>
          <div className="flex flex-col gap-2">
            {BOOK_DETAIL.in_my_lists.map((l, i) => (
              <div className="flex items-center gap-3.5 bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[10px] py-3 px-4 cursor-pointer transition-colors duration-150 hover:bg-(--yellow-soft)" key={i}>
                <div>
                  <div className="text-[14px] font-semibold text-(--ink-2)">{l.title}</div>
                  <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase mt-0.5">
                    {l.kind} · {l.count} livros
                  </div>
                </div>
                <div className="ml-auto font-mono text-[11px] text-(--ink-3) tracking-[0.04em]">você</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="font-mono text-[11px] text-(--ink-3) tracking-[0.08em] uppercase mb-3 flex items-center gap-2">
            <span>Comunidade</span>
            <span className="flex-1 h-px bg-(--rule)" />
          </div>
          <div className="flex flex-col gap-2">
            {BOOK_DETAIL.in_public_lists.map((l, i) => (
              <div className="flex items-center gap-3.5 bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[10px] py-3 px-4 cursor-pointer transition-colors duration-150 hover:bg-(--yellow-soft)" key={i}>
                <div>
                  <div className="text-[14px] font-semibold text-(--ink-2)">{l.title}</div>
                  <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase mt-0.5">
                    por {l.by} · {l.count} livros
                  </div>
                </div>
                <div className="ml-auto font-mono text-[11px] text-(--ink-3) tracking-[0.04em]">
                  <span className="text-(--ink-2) font-semibold">{l.subscribers.toLocaleString("pt-BR")}</span>{" "}
                  seguidores
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InLists;
