import Link from "next/link";
import { VISIBILITY_LABEL } from "@/components/lists/visibility";
import type { BookPageData } from "@/lib/queries/book";
import { SectionHeader } from "./section-header";

const card =
  "flex items-center gap-3.5 bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[12px] py-3 px-4 transition-colors duration-150 hover:bg-(--yellow-soft)";

export default function InLists({ lists }: { lists: BookPageData["lists"] }) {
  if (lists.mine.length === 0 && lists.community.length === 0) return null;

  return (
    <section data-screen-label="05 Em listas">
      <SectionHeader
        eyebrow="Listas"
        title={`Em ${lists.total} ${lists.total === 1 ? "lista" : "listas"}`}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {lists.mine.map((l) => (
          <Link href={`/lists/${l.id}`} className={card} key={l.id}>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-(--ink-2) truncate">
                {l.title}
              </div>
              <div className="text-[12px] text-(--ink-4) mt-0.5">
                {VISIBILITY_LABEL[l.visibility]} · {l.count}{" "}
                {l.count === 1 ? "livro" : "livros"}
              </div>
            </div>
            <span className="ml-auto shrink-0 text-[11px] font-medium text-(--ink-2) bg-(--yellow-soft) border border-(--yellow-deep) rounded-md px-2 py-0.5">
              {l.mine ? "Sua" : "Colaboração"}
            </span>
          </Link>
        ))}
        {lists.community.map((l) => (
          <Link href={`/lists/${l.id}`} className={card} key={l.id}>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-(--ink-2) truncate">
                {l.title}
              </div>
              <div className="text-[12px] text-(--ink-4) mt-0.5">
                por {l.by} · {l.count} {l.count === 1 ? "livro" : "livros"}
              </div>
            </div>
            <span className="ml-auto shrink-0 text-[12px] text-(--ink-4)">
              <strong className="text-(--ink-2) font-semibold">
                {l.followers.toLocaleString("pt-BR")}
              </strong>{" "}
              {l.followers === 1 ? "seguidor" : "seguidores"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
