import Chips from "@/components/shared/chips";
import BookCover from "@/components/shared/book-cover";
import { useState } from "react";
import { RELEITURAS } from "../mock-profile";

const ReleiturasTab = () => {
  const [sort, setSort] = useState("recente");
  const items = [...RELEITURAS].sort((a, b) => {
    if (sort === "mais") return b.times - a.times;
    return 0;
  });

  return (
    <>
      <Chips
        label="Ordem"
        value={sort}
        onChange={setSort}
        options={[
          { id: "recente", label: "Última releitura" },
          { id: "mais", label: "Mais releituras" },
        ]}
      />
      <div className="flex flex-col gap-4">
        {items.map((r, i) => (
          <article
            className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-[22px] px-[26px] grid grid-cols-[100px_1fr_220px] gap-6 items-center"
            key={i}
          >
            <BookCover
              book={r.book}
              size="md"
              style={{ width: 100, height: 150 }}
            />
            <div>
              <div className="text-[17px] font-bold text-(--ink) tracking-[-0.01em]">
                {r.book.title}
              </div>
              <div className="text-[12px] text-(--ink-4) mt-[3px]">
                {r.book.author}
              </div>
              {r.note && (
                <div className="mt-3 text-[13px] text-(--ink-3) leading-[1.5] italic max-w-[480px]">
                  &quot;{r.note}&quot;
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 border-l border-[rgba(67,62,18,0.1)] pl-[22px]">
              <div className="text-[32px] font-extrabold text-(--ink) tracking-[-0.025em] leading-none flex items-baseline gap-1.5">
                {r.times}{" "}
                <span className="text-[11px] font-medium text-(--ink-4) tracking-normal font-mono uppercase">
                  vezes
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-1.5 font-mono text-[11px] text-(--ink-3) tracking-[0.04em]">
                {r.dates.map((d, j) => {
                  const latest = j === r.dates.length - 1;
                  return (
                    <span
                      key={j}
                      className={`flex items-center ${latest ? "text-(--ink) font-semibold" : ""}`}
                    >
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle ${latest ? "bg-(--yellow) border border-(--ink-2)" : "bg-(--ink-3)"}`}
                      ></span>
                      {d}
                    </span>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};

export default ReleiturasTab;
