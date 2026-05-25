import BookCover from "@/components/shared/book-cover";
import { MY_REVIEWS } from "../mock-profile";

const AvaliacoesTab = () => {
  return (
    <div className="flex flex-col gap-4.5">
      {MY_REVIEWS.map((r, i) => (
        <article className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-6.5 px-7 grid grid-cols-[120px_1fr] gap-7" key={i}>
          <BookCover book={r.book} size="md" style={{ width: 120, height: 180 }} />
          <div>
            <div className="flex items-center gap-3.5 mb-2">
              <div>
                <div className="text-[18px] font-bold text-(--ink) tracking-[-0.01em]">{r.book.title}</div>
                <div className="text-[12px] text-(--ink-4) mt-0.5">{r.book.author}</div>
              </div>
              <div className="flex gap-px text-[18px] text-(--ink-2) tracking-[-1px]">
                {[0, 1, 2, 3, 4].map((s) => (
                  <span key={s} className={s < r.stars ? "" : "text-[rgba(67,62,18,0.18)]"}>
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase flex gap-3 mt-1 mb-3.5">
              <span>{r.date}</span>
              <span className="text-(--ink-5)">·</span>
              <span>lido em {r.days} dias</span>
            </div>
            <p className="text-[14px] leading-[1.6] text-(--ink-3) text-pretty m-0">{r.text}</p>
            <div className="mt-4 pt-3.5 border-t border-(--rule) flex gap-5.5 font-mono text-[11px] text-(--ink-3) tracking-[0.04em] [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1.5 [&_strong]:text-(--ink) [&_strong]:font-['Inter',sans-serif] [&_strong]:font-semibold [&_strong]:text-[13px]">
              <span>
                ♡ <strong>{r.likes}</strong> curtidas
              </span>
              <span>
                💬 <strong>{r.comments}</strong> comentários
              </span>
              <span style={{ marginLeft: "auto" }}>
                <a href="#" style={{ color: "var(--ink-3)" }}>
                  editar
                </a>
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default AvaliacoesTab;
