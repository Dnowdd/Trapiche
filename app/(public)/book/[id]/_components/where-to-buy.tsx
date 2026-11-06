import { ArrowUpRight } from "lucide-react";
import { storeLinks } from "@/lib/stores";
import type { BookPageData } from "@/lib/queries/book";
import { SectionHeader } from "./section-header";

export default function WhereToBuy({ book }: { book: BookPageData["book"] }) {
  const links = storeLinks(book);
  const sponsored = links.some((l) => l.sponsored);

  return (
    <section data-screen-label="Onde encontrar">
      <SectionHeader eyebrow="Para ler" title="Onde encontrar" small />
      <ul className="m-0 p-0 list-none rounded-[14px] border border-[rgba(var(--ink-rgb),0.07)] bg-(--cream-card) divide-y divide-(--rule)">
        {links.map((l) => (
          <li key={l.id}>
            <a
              href={l.url}
              target="_blank"
              rel={`noopener noreferrer${l.sponsored ? " sponsored" : ""}`}
              className="group flex items-center justify-between gap-3 px-4 py-3 hover:bg-(--yellow-soft) first:rounded-t-[14px] last:rounded-b-[14px]"
            >
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-(--ink-2)">
                  {l.name}
                </span>
                <span className="block text-[11.5px] text-(--ink-4)">
                  {l.hint}
                </span>
              </span>
              <ArrowUpRight
                size={16}
                className="shrink-0 text-(--ink-4) transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-(--ink-2)"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
      <p className="m-0 mt-2 text-[11px] text-(--ink-4) leading-normal">
        {sponsored
          ? "Comprando pela Amazon, o Trapiche pode ganhar uma comissão, sem custo extra pra você."
          : "Links de busca por ISBN ou título. O Trapiche não vende livros."}
      </p>
    </section>
  );
}
