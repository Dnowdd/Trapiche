import { type CSSProperties } from "react";
import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import { getHomeLists } from "@/lib/queries/home";

const STACK_BASE: CSSProperties = {
  position: "absolute",
  width: 90,
  height: 130,
  bottom: 14,
  borderRadius: 3,
  boxShadow: "0 10px 16px -8px rgba(67,62,18,0.45)",
};

const STACK_POSITIONS: CSSProperties[] = [
  {
    ...STACK_BASE,
    left: "26%",
    transform: "translateX(-50%) rotate(-7deg)",
    zIndex: 1,
  },
  { ...STACK_BASE, left: "50%", transform: "translateX(-50%)", zIndex: 3 },
  {
    ...STACK_BASE,
    left: "74%",
    transform: "translateX(-50%) rotate(7deg)",
    zIndex: 2,
  },
];

const Lists = async () => {
  const lists = await getHomeLists(3);

  return (
    <section className="px-4 sm:px-8 lg:px-20" data-screen-label="04 Listas">
      <div className="pb-4">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
          Da comunidade
        </div>
        <h2 className="m-0 text-[22px] font-bold text-(--ink-2) tracking-[-0.01em]">
          Listas do Trapiche
        </h2>
      </div>

      {lists.length === 0 ? (
        <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[16px] font-bold text-(--ink)">
              Ainda não tem listas públicas por aqui
            </div>
            <p className="m-0 mt-1 text-[13px] text-(--ink-3)">
              Junte livros por tema, clima ou ocasião e compartilhe com quem
              quiser.
            </p>
          </div>
          <Link
            href="/profile?tab=listas"
            className="shrink-0 self-start sm:self-auto h-10 px-4 rounded-[10px] bg-(--yellow) border border-(--yellow-deep) text-(--ink) text-[13px] font-semibold inline-flex items-center hover:bg-(--yellow-deep)"
          >
            Criar a primeira lista
          </Link>
        </div>
      ) : (
        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
          {lists.map((l) => (
            <Link
              href={`/lists/${l.id}`}
              className="bg-(--cream-card) border border-[rgba(67,62,18,0.08)] rounded-[18px] p-4.5 pb-5 flex flex-col gap-3.5 transition-[transform,box-shadow] duration-180 hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(67,62,18,0.04),0_24px_60px_-28px_rgba(67,62,18,0.3)]"
              key={l.id}
            >
              <div className="h-40 relative bg-(--yellow-soft) rounded-[10px] overflow-hidden">
                {l.books.map((b, j) => (
                  <BookCover
                    key={b.id}
                    book={b}
                    size="sm"
                    sizes="90px"
                    style={STACK_POSITIONS[j]}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-1">
                <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">
                  {l.count} {l.count === 1 ? "livro" : "livros"}
                  {l.followers > 0 &&
                    ` · ${l.followers} ${l.followers === 1 ? "seguidor" : "seguidores"}`}
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
            </Link>
          ))}

          <Link
            href="/profile?tab=listas"
            className="rounded-[18px] flex flex-col items-center justify-center text-center gap-2 min-h-62 border-[1.5px] border-dashed border-[rgba(67,62,18,0.25)] transition-[background,border-color] duration-180 hover:bg-(--yellow-soft) hover:border-(--ink-3)"
          >
            <span className="text-[32px] font-light text-(--ink-3) leading-none">
              +
            </span>
            <span className="text-[13px] text-(--ink-3) font-medium">
              Criar sua lista
            </span>
          </Link>
        </div>
      )}
    </section>
  );
};

export default Lists;
