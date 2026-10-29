"use client";

import { useState } from "react";
import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import Chips from "@/components/shared/chips";
import { useAction } from "@/components/reading/use-action";
import { toast } from "@/components/shared/toast";
import { returnToPile } from "@/lib/actions/shelf";
import type { getAbandonos } from "@/lib/queries/profile";

type Item = Awaited<ReturnType<typeof getAbandonos>>[number];

function BackToPile({ bookId }: { bookId: string }) {
  const { pending, run } = useAction();
  return (
    <button
      disabled={pending}
      onClick={() =>
        run(
          () => returnToPile(bookId),
          () => toast("De volta para a pilha de quero ler."),
          toast,
        )
      }
      className="text-[11px] py-1.5 px-3 border border-(--ink-3) rounded-md text-(--ink-2) font-medium cursor-pointer hover:bg-(--yellow-soft) disabled:cursor-wait disabled:opacity-60"
    >
      ↺ Voltar à pilha
    </button>
  );
}

export default function AbandonosTab({
  items,
  isOwner,
}: {
  items: Item[];
  isOwner: boolean;
}) {
  const [sort, setSort] = useState("recente");
  const sorted = [...items].sort((a, b) => {
    if (sort === "avancados") return b.percent - a.percent;
    if (sort === "tempo") return b.spentDays - a.spentDays;
    return b.abandonedTs - a.abandonedTs;
  });

  return (
    <>
      <div className="bg-(--cream-card) border-l-[3px] border-l-(--ink-3) rounded-[0_8px_8px_0] py-4 px-5.5 mb-5.5 text-[13px] text-(--ink-3) leading-normal max-w-180 [&_strong]:text-(--ink-2) [&_strong]:font-semibold">
        <strong>Sem culpa.</strong> Abandonar também é leitura. Aqui ficam os
        livros{" "}
        {isOwner
          ? "que você começou e não terminou"
          : "começados e não terminados"}{" "}
        — alguns vão voltar para a pilha, outros não, e está tudo bem.
      </div>

      <Chips
        label="Ordem"
        value={sort}
        onChange={setSort}
        options={[
          { id: "recente", label: "Mais recente" },
          { id: "avancados", label: "Mais avançados" },
          { id: "tempo", label: "Mais tempo passado" },
        ]}
      />

      {sorted.length === 0 ? (
        <p className="m-0 text-[14px] text-(--ink-4)">
          Nenhum livro abandonado.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map((a) => (
            <article
              className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-5 sm:py-5.5 sm:px-6.5 grid grid-cols-[64px_1fr] sm:grid-cols-[100px_1fr_auto] gap-4 sm:gap-6 items-center"
              key={a.book.id}
            >
              <Link href={`/book/${a.book.id}`}>
                <BookCover
                  book={a.book}
                  size="md"
                  sizes="(max-width: 640px) 64px, 100px"
                  style={{ width: "100%", aspectRatio: "2/3" }}
                />
              </Link>
              <div className="min-w-0">
                <Link
                  href={`/book/${a.book.id}`}
                  className="text-[17px] font-bold text-(--ink) tracking-[-0.01em] hover:underline"
                >
                  {a.book.title}
                </Link>
                <div className="text-[12px] text-(--ink-4) mt-0.75">
                  {a.book.author}
                </div>
                <div className="mt-3.5 flex items-center gap-2.5 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] [&_strong]:text-(--ink-2) [&_strong]:font-['Inter',sans-serif] [&_strong]:font-bold [&_strong]:text-[12px]">
                  <div className="flex-1 max-w-70 h-1.25 rounded-[3px] bg-[rgba(67,62,18,0.1)] overflow-hidden relative">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-(--ink-3) rounded-[3px]"
                      style={{ width: a.percent + "%" }}
                    />
                  </div>
                  <span>
                    parou em <strong>{a.percent}%</strong> · pág. {a.page}
                    {a.total ? ` de ${a.total}` : ""}
                  </span>
                </div>
                {a.reason && (
                  <div className="mt-3.5 text-[13px] text-(--ink-3) italic leading-normal border-l-2 border-(--rule) pl-3 max-w-140">
                    &quot;{a.reason}&quot;
                  </div>
                )}
              </div>
              <div className="col-span-2 sm:col-span-1 flex flex-wrap sm:flex-col items-center sm:items-end sm:text-right gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-(--rule)">
                <span className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase">
                  {a.abandonedAt}
                </span>
                <span className="text-[12px] text-(--ink-3) [&_strong]:text-(--ink) [&_strong]:font-semibold">
                  depois de{" "}
                  <strong>
                    {a.spentDays} {a.spentDays === 1 ? "dia" : "dias"}
                  </strong>
                </span>
                {a.again ? (
                  isOwner ? (
                    <BackToPile bookId={a.book.id} />
                  ) : (
                    <span className="font-mono text-[10px] py-0.75 px-2 rounded bg-(--yellow-soft) text-(--ink-3) tracking-[0.04em] uppercase">
                      pretende voltar
                    </span>
                  )
                ) : (
                  <span className="font-mono text-[10px] py-0.75 px-2 rounded bg-[rgba(67,62,18,0.06)] text-(--ink-4) tracking-[0.04em] uppercase">
                    não pretendo
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
