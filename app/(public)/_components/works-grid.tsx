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

export function GoogleWorks({
  works,
  showAuthor,
}: {
  works: PersonWork[];
  showAuthor?: boolean;
}) {
  if (works.length === 0) return null;
  return (
    <section className="mt-14 pt-10 border-t border-(--rule)">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
            Google Books
          </div>
          <h2 className="m-0 text-[20px] font-bold tracking-[-0.015em] text-(--ink)">
            Mais no Google Books
          </h2>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- Google's branding rules require the unaltered official badge. */}
        <img
          src="/powered-by-google.png"
          alt="Powered by Google"
          width={62}
          height={30}
          className="h-6 w-auto"
        />
      </div>
      <WorksGrid works={works} showAuthor={showAuthor} />
    </section>
  );
}
