import Link from "next/link";
import { VISIBILITY_LABEL } from "@/components/lists/visibility";
import type { BookPageData } from "@/lib/queries/book";

const card =
  "flex items-center gap-3.5 bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[10px] py-3 px-4 transition-colors duration-150 hover:bg-(--yellow-soft)";

export default function InLists({
  lists,
  loggedIn,
}: {
  lists: BookPageData["lists"];
  loggedIn: boolean;
}) {
  return (
    <section className="mt-14" data-screen-label="07 Em listas">
      <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
        Onde esse livro aparece
      </div>
      <h2 className="m-0 mb-1.5 text-[24px] font-bold tracking-[-0.015em] text-(--ink)">
        Em {lists.total} {lists.total === 1 ? "lista" : "listas"}
      </h2>
      <div className="h-5.5" />
      <div className="grid grid-cols-2 gap-7.5">
        <div>
          <div className="font-mono text-[11px] text-(--ink-3) tracking-[0.08em] uppercase mb-3 flex items-center gap-2">
            <span>Suas estantes</span>
            <span className="flex-1 h-px bg-(--rule)" />
          </div>
          <div className="flex flex-col gap-2">
            {lists.mine.length === 0 ? (
              <p className="m-0 text-[13px] text-(--ink-4) leading-normal">
                {loggedIn
                  ? "Esse livro não está em nenhuma lista sua. Use “Adicionar a uma lista” lá em cima."
                  : "Entre para guardar esse livro nas suas listas."}
              </p>
            ) : (
              lists.mine.map((l) => (
                <Link href={`/lists/${l.id}`} className={card} key={l.id}>
                  <div>
                    <div className="text-[14px] font-semibold text-(--ink-2)">
                      {l.title}
                    </div>
                    <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase mt-0.5">
                      {VISIBILITY_LABEL[l.visibility]} · {l.count}{" "}
                      {l.count === 1 ? "livro" : "livros"}
                    </div>
                  </div>
                  <div className="ml-auto font-mono text-[11px] text-(--ink-3) tracking-[0.04em]">
                    {l.mine ? "você" : "colaboração"}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="font-mono text-[11px] text-(--ink-3) tracking-[0.08em] uppercase mb-3 flex items-center gap-2">
            <span>Comunidade</span>
            <span className="flex-1 h-px bg-(--rule)" />
          </div>
          <div className="flex flex-col gap-2">
            {lists.community.length === 0 ? (
              <p className="m-0 text-[13px] text-(--ink-4) leading-normal">
                Nenhuma lista pública da comunidade tem esse livro ainda.
              </p>
            ) : (
              lists.community.map((l) => (
                <Link href={`/lists/${l.id}`} className={card} key={l.id}>
                  <div>
                    <div className="text-[14px] font-semibold text-(--ink-2)">
                      {l.title}
                    </div>
                    <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase mt-0.5">
                      por {l.by} · {l.count}{" "}
                      {l.count === 1 ? "livro" : "livros"}
                    </div>
                  </div>
                  <div className="ml-auto font-mono text-[11px] text-(--ink-3) tracking-[0.04em]">
                    <span className="text-(--ink-2) font-semibold">
                      {l.followers.toLocaleString("pt-BR")}
                    </span>{" "}
                    {l.followers === 1 ? "seguidor" : "seguidores"}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
