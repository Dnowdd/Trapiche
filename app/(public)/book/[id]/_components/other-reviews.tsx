import Link from "next/link";
import type { BookPageData } from "@/lib/queries/book";
import ReviewCard from "./review-card";

export default function OtherReviews({
  bookId,
  reviews,
  loggedIn,
}: {
  bookId: string;
  reviews: BookPageData["reviews"];
  loggedIn: boolean;
}) {
  return (
    <section className="mt-14" data-screen-label="06 Avaliacoes">
      <div className="flex items-end justify-between mb-5.5">
        <div>
          <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
            Da comunidade
          </div>
          <h2 className="m-0 text-[24px] font-bold tracking-[-0.015em] text-(--ink)">
            Resenhas em destaque
          </h2>
        </div>
        {reviews.total > reviews.items.length && (
          <Link
            className="text-[12px] text-(--ink-3) border-b border-(--ink-4) hover:text-(--ink)"
            href={`/book/${bookId}/resenhas`}
          >
            Ver todas as {reviews.total.toLocaleString("pt-BR")} →
          </Link>
        )}
      </div>
      {reviews.items.length === 0 ? (
        <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-7 px-7 text-[14px] text-(--ink-3)">
          Ninguém escreveu uma resenha desse livro ainda.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.items.map((r) => (
            <ReviewCard key={r.id} review={r} loggedIn={loggedIn} />
          ))}
        </div>
      )}
    </section>
  );
}
