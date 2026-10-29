import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import type { PersonWork } from "@/lib/queries/people";

export default function WorksGrid({
  works,
  showAuthor,
}: {
  works: PersonWork[];
  showAuthor?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4.5 gap-y-6 sm:gap-y-8">
      {works.map(({ cover, year, editions }) => (
        <Link
          href={`/book/${cover.id}`}
          key={cover.id}
          className="flex flex-col gap-2 transition-transform duration-120 hover:-translate-y-0.5"
        >
          <BookCover
            book={cover}
            size="md"
            sizes="(max-width: 640px) 33vw, 200px"
            style={{ width: "100%", aspectRatio: "2/3" }}
          />
          <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight line-clamp-2">
            {cover.title}
          </div>
          <div className="text-[11px] text-(--ink-4) -mt-1 leading-snug">
            {[showAuthor ? cover.author : null, year]
              .filter(Boolean)
              .join(" · ")}
            {editions > 1 && (
              <span className="block text-(--ink-5)">{editions} edições</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
