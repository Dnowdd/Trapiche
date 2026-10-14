"use client";

import { useState } from "react";
import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import ReviewModal from "@/components/reading/review-modal";
import type { getAvaliacoes } from "@/lib/queries/profile";

type Item = Awaited<ReturnType<typeof getAvaliacoes>>[number];

export default function AvaliacoesTab({
  items,
  isOwner,
}: {
  items: Item[];
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState<Item | null>(null);

  if (items.length === 0)
    return (
      <p className="m-0 text-[14px] text-(--ink-4)">
        {isOwner
          ? "Você ainda não avaliou nenhum livro. Abra um livro que já leu e escreva sua resenha."
          : "Nenhuma avaliação ainda."}
      </p>
    );

  return (
    <div className="flex flex-col gap-4.5">
      {items.map((r) => (
        <article
          className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-6.5 px-7 grid grid-cols-[120px_1fr] gap-7"
          key={r.id}
        >
          <Link href={`/book/${r.book.id}`}>
            <BookCover
              book={r.book}
              size="md"
              style={{ width: 120, height: 180 }}
            />
          </Link>
          <div>
            <div className="flex items-center gap-3.5 mb-2">
              <div>
                <Link
                  href={`/book/${r.book.id}`}
                  className="text-[18px] font-bold text-(--ink) tracking-[-0.01em] hover:underline"
                >
                  {r.book.title}
                </Link>
                <div className="text-[12px] text-(--ink-4) mt-0.5">
                  {r.book.author}
                </div>
              </div>
              <div className="flex gap-px text-[18px] text-(--ink-2) tracking-[-1px]">
                {[0, 1, 2, 3, 4].map((s) => (
                  <span
                    key={s}
                    className={s < r.stars ? "" : "text-[rgba(67,62,18,0.18)]"}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase flex gap-3 mt-1 mb-3.5">
              <span>{r.date}</span>
              {r.days != null && (
                <>
                  <span className="text-(--ink-5)">·</span>
                  <span>
                    lido em {r.days} {r.days === 1 ? "dia" : "dias"}
                  </span>
                </>
              )}
            </div>
            {r.text ? (
              <p className="text-[14px] leading-[1.6] text-(--ink-3) text-pretty m-0 whitespace-pre-line">
                {r.text}
              </p>
            ) : (
              <p className="text-[13px] text-(--ink-4) m-0">Só a nota.</p>
            )}
            <div className="mt-4 pt-3.5 border-t border-(--rule) flex gap-5.5 font-mono text-[11px] text-(--ink-3) tracking-[0.04em] [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1.5 [&_strong]:text-(--ink) [&_strong]:font-['Inter',sans-serif] [&_strong]:font-semibold [&_strong]:text-[13px]">
              <span>
                ♡ <strong>{r.likes}</strong>{" "}
                {r.likes === 1 ? "curtida" : "curtidas"}
              </span>
              <Link
                href={`/book/${r.book.id}/resenhas`}
                className="inline-flex items-center gap-1.5 hover:text-(--ink)"
              >
                💬 <strong>{r.comments}</strong>{" "}
                {r.comments === 1 ? "comentário" : "comentários"}
              </Link>
              {isOwner && (
                <button
                  type="button"
                  className="ml-auto text-(--ink-3) cursor-pointer hover:text-(--ink) underline underline-offset-2"
                  onClick={() => setEditing(r)}
                >
                  editar
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
      {editing && (
        <ReviewModal
          open
          onOpenChange={(o) => !o && setEditing(null)}
          bookId={editing.book.id}
          title={editing.book.title}
          initial={{ rating: editing.stars, text: editing.text }}
        />
      )}
    </div>
  );
}
