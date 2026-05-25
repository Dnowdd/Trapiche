import { BOOK_DETAIL } from "../mock-book";

const OtherReviews = () => {
  return (
    <section className="mt-14" data-screen-label="06 Avaliacoes">
      <div className="flex items-end justify-between mb-5.5">
        <div>
          <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Da comunidade</div>
          <h2 className="m-0 text-[24px] font-bold tracking-[-0.015em] text-(--ink)">Resenhas em destaque</h2>
        </div>
        <a className="text-[12px] text-(--ink-3) border-b border-(--ink-4) hover:text-(--ink)" href="#">
          Ver todas as {BOOK_DETAIL.rating.count.toLocaleString("pt-BR")} →
        </a>
      </div>
      <div className="flex flex-col gap-4">
        {BOOK_DETAIL.reviews.map((r, i) => (
          <article className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-5.5 px-6.5" key={i}>
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-(--cream-deep) border-[1.5px] border-(--ink-3) flex items-center justify-center text-[12px] font-bold text-(--ink-2)">{r.initials}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-(--ink-2)">{r.user}</div>
                <div className="text-[11px] text-(--ink-4) font-mono tracking-[0.04em]">{r.handle}</div>
              </div>
              <div className="text-[16px] text-(--ink-2) tracking-[-1px]">
                {[0, 1, 2, 3, 4].map((s) => (
                  <span key={s} className={s < r.stars ? "" : "text-[rgba(67,62,18,0.18)]"}>★</span>
                ))}
              </div>
              <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">{r.date}</div>
            </div>
            <p className="text-[14px] leading-[1.6] text-(--ink-3) [text-wrap:pretty] m-0 mb-3.5">{r.text}</p>
            <div className="pt-3 border-t border-(--rule) flex items-center gap-4.5 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] [&_span_strong]:text-(--ink-2) [&_span_strong]:font-['Inter',sans-serif]">
              <span>♡ <strong>{r.likes}</strong></span>
              <span>💬 <strong>{r.comments}</strong></span>
              <span className="ml-auto">lido em {r.days} dias</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default OtherReviews;
