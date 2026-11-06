import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import { getRecommendations } from "@/lib/queries/recommendations";

export default async function ForYou({ userId }: { userId: string }) {
  const items = await getRecommendations(userId, 8).catch(() => []);
  if (items.length === 0) return null;

  return (
    <section
      id="pra-voce"
      className="px-4 sm:px-8 lg:px-20 scroll-mt-6"
      data-screen-label="Pra você"
    >
      <div className="pb-4">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
          A partir da sua estante
        </div>
        <h2 className="m-0 text-[22px] font-bold text-(--ink-2) tracking-[-0.01em]">
          Pra você ler depois
        </h2>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-4 gap-y-6">
        {items.map(({ book, reason }) => (
          <Link
            href={`/book/${book.id}`}
            className="flex flex-col gap-2 transition-transform duration-120 hover:-translate-y-0.5"
            key={book.id}
          >
            <BookCover
              book={book}
              size="md"
              style={{ width: "100%", aspectRatio: "2/3" }}
            />
            <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight line-clamp-2">
              {book.title}
            </div>
            <div className="text-[11px] text-(--ink-4) -mt-1 line-clamp-2">
              {reason}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
