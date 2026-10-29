"use client";

import Stars from "@/components/shared/stars";
import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import ReviewModal from "@/components/reading/review-modal";
import type { getAvaliacoes } from "@/lib/queries/profile";
import SpoilerText from "@/components/shared/spoiler-text";

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
          className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-5 sm:py-6.5 sm:px-7 grid grid-cols-[72px_1fr] sm:grid-cols-[120px_1fr] gap-4 sm:gap-7"
          key={r.id}
        >
          <Link href={`/book/${r.book.id}`}>
            <BookCover
              book={r.book}
              size="md"
              sizes="(max-width: 640px) 72px, 120px"
              style={{ width: "100%", aspectRatio: "2/3" }}
            />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mb-2">
              <div>
                <Link
                  href={`/book/${r.book.id}`}
                  className="text-[16px] sm:text-[18px] font-bold text-(--ink) tracking-[-0.01em] hover:underline"
                >
                  {r.book.title}
                </Link>
                <div className="text-[12px] text-(--ink-4) mt-0.5">
                  {r.book.author}
                </div>
              </div>
              <div className="flex gap-px text-[18px] text-(--ink-2) tracking-[-1px]">
                <Stars value={r.stars} />
              </div>
            </div>
            <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase flex flex-wrap gap-x-3 gap-y-1 mt-1 mb-3.5">
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
            {isOwner && r.hidden && (
              <p className="m-0 mb-2 text-[12px] text-[#9a4a2a]">
                Texto ocultado pela moderação. Só você o vê.
              </p>
            )}
            {r.text ? (
              <SpoilerText
                spoiler={r.spoiler && !isOwner}
                className="text-[14px] leading-[1.6] text-(--ink-3) text-pretty m-0 whitespace-pre-line"
              >
                {r.text}
              </SpoilerText>
            ) : (
              <p className="text-[13px] text-(--ink-4) m-0">Só a nota.</p>
            )}
            <div className="mt-4 pt-3.5 border-t border-(--rule) flex flex-wrap gap-x-5.5 gap-y-2 font-mono text-[11px] text-(--ink-3) tracking-[0.04em] [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1.5 [&_strong]:text-(--ink) [&_strong]:font-['Inter',sans-serif] [&_strong]:font-semibold [&_strong]:text-[13px]">
              <span>
                <Heart className="w-3.5 h-3.5" /> <strong>{r.likes}</strong>{" "}
                {r.likes === 1 ? "curtida" : "curtidas"}
              </span>
              <Link
                href={`/book/${r.book.id}/resenhas`}
                className="inline-flex items-center gap-1.5 hover:text-(--ink)"
              >
                <MessageCircle className="w-3.5 h-3.5" />{" "}
                <strong>{r.comments}</strong>{" "}
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
          initial={{
            rating: editing.stars,
            text: editing.text,
            spoiler: editing.spoiler,
          }}
        />
      )}
    </div>
  );
}
