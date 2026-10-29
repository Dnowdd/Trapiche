import { type CSSProperties } from "react";
import BookCover from "@/components/shared/book-cover";
import Stars from "@/components/shared/stars";
import { getReviews } from "@/app/catalog";

const REVIEW_BOOK_STYLE: CSSProperties = {
  width: 42,
  height: 60,
  borderRadius: 3,
  flexShrink: 0,
  padding: "6px 5px",
};

const Reviews = async () => {
  const reviews = await getReviews();

  return (
    <section className="px-12.5" data-screen-label="07 Reviews">
      <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-7 px-7.5">
        <div
          className="flex items-end justify-between"
          style={{ padding: "0 0 8px" }}
        >
          <div>
            <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
              Últimas avaliações
            </div>

            <h2 className="m-0 text-[22px] font-bold text-(--ink-2) tracking-[-0.01em]">
              O que estão lendo agora
            </h2>
          </div>

          <a
            className="text-[12px] text-(--ink-3) font-medium border-b border-(--ink-4) pb-px transition-colors duration-150 hover:text-(--ink)"
            href="#"
          >
            Ver todas as avaliações →
          </a>
        </div>

        <div className="grid grid-cols-3 gap-4.5 mt-4.5">
          {reviews.map((r, i) => (
            <div
              className="bg-(--cream) border border-[rgba(67,62,18,0.07)] rounded-[10px] py-4.5 px-5 flex flex-col gap-3"
              key={i}
            >
              <div className="flex items-center gap-3 [&_.cover-title]:text-[9px] [&_.cover-title]:leading-[1.05] [&_.cover-author]:hidden [&_.cover-pub]:hidden [&_.cover-top]:hidden">
                <BookCover book={r.book} size="sm" style={REVIEW_BOOK_STYLE} />

                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="text-[13px] font-bold text-(--ink-2) tracking-[-0.005em] whitespace-nowrap overflow-hidden text-ellipsis">
                    {r.book.title}
                  </div>

                  <div className="text-[11px] text-(--ink-4)">
                    {r.book.author}
                  </div>
                  <Stars
                    value={r.stars}
                    className="text-[13px]"
                    emptyClassName="text-[rgba(67,62,18,0.15)]"
                  />
                </div>
              </div>

              <p className="text-[13px] leading-[1.55] text-(--ink-3)">
                &quot;{r.text}&quot;
              </p>

              <div className="flex items-center justify-between border-t border-(--rule) pt-3 text-[11px]">
                <div className="flex items-center gap-2 text-(--ink-3)">
                  <span className="w-5 h-5 rounded-full bg-(--cream-deep) border border-(--ink-3) text-[9px] font-bold flex items-center justify-center text-(--ink-2)">
                    {r.initials}
                  </span>
                  <span>
                    <strong className="text-(--ink-2) font-semibold">
                      {r.user}
                    </strong>{" "}
                    {r.handle}
                  </span>
                </div>

                <span className="text-(--ink-4) font-mono text-[10px] tracking-[0.04em]">
                  {r.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
