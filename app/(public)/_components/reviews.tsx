import { type CSSProperties } from "react";
import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import Stars from "@/components/shared/stars";
import SpoilerText from "@/components/shared/spoiler-text";
import { getHomeReviews } from "@/lib/queries/home";

const REVIEW_BOOK_STYLE: CSSProperties = {
  width: 42,
  height: 60,
  borderRadius: 3,
  flexShrink: 0,
  padding: "6px 5px",
};

const Reviews = async () => {
  const reviews = await getHomeReviews(6);
  if (reviews.length === 0) return null;

  return (
    <section
      id="resenhas"
      className="px-4 sm:px-8 lg:px-20 scroll-mt-6"
      data-screen-label="07 Resenhas"
    >
      <div className="pb-4">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
          Últimas resenhas
        </div>
        <h2 className="m-0 text-[22px] font-bold text-(--ink-2) tracking-[-0.01em]">
          O que estão lendo agora
        </h2>
      </div>

      <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <article
            className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[14px] py-4.5 px-5 flex flex-col gap-3"
            key={r.id}
          >
            <Link
              href={`/book/${r.book.id}`}
              className="flex items-center gap-3 group [&_.cover-title]:text-[9px] [&_.cover-title]:leading-[1.05] [&_.cover-author]:hidden [&_.cover-pub]:hidden [&_.cover-top]:hidden"
            >
              <BookCover
                book={r.book}
                size="sm"
                sizes="42px"
                style={REVIEW_BOOK_STYLE}
              />
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="text-[13px] font-bold text-(--ink-2) tracking-[-0.005em] truncate group-hover:underline">
                  {r.book.title}
                </div>
                <div className="text-[11px] text-(--ink-4) truncate">
                  {r.book.author}
                </div>
                <Stars value={r.stars} className="text-[13px]" />
              </div>
            </Link>

            <SpoilerText
              spoiler={r.spoiler}
              className="m-0 text-[13px] leading-[1.55] text-(--ink-3) line-clamp-5 whitespace-pre-line"
            >
              {r.text}
            </SpoilerText>

            <div className="mt-auto flex items-center justify-between border-t border-(--rule) pt-3 text-[11px]">
              <Link
                href={`/u/${r.handle}`}
                className="flex items-center gap-2 text-(--ink-3) min-w-0 hover:text-(--ink)"
              >
                <span className="w-5 h-5 shrink-0 rounded-full bg-(--cream-deep) border border-(--ink-3) text-[9px] font-bold flex items-center justify-center text-(--ink-2)">
                  {r.initials}
                </span>
                <span className="truncate">
                  <strong className="text-(--ink-2) font-semibold">
                    {r.user}
                  </strong>{" "}
                  @{r.handle}
                </span>
              </Link>
              <span className="text-(--ink-4) font-mono text-[10px] tracking-[0.04em] shrink-0">
                {r.date}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Reviews;
