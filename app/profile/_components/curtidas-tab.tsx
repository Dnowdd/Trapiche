import { useState } from "react";
import { LIKES } from "../mock-profile";
import Chips from "@/components/shared/chips";
import BookCover from "@/components/shared/book-cover";

const CurtidasTab = () => {
  const [filter, setFilter] = useState("todos");
  const y2026 = LIKES.filter((l) => l.year === 2026);
  const y2025 = LIKES.filter((l) => l.year === 2025);

  const items = filter === "2026" ? y2026 : filter === "2025" ? y2025 : LIKES;

  return (
    <>
      <Chips
        label="Curti em"
        value={filter}
        onChange={setFilter}
        options={[
          { id: "todos", label: "Tudo", count: LIKES.length },
          { id: "2026", label: "Este ano", count: y2026.length },
          { id: "2025", label: "2025", count: y2025.length },
        ]}
      />
      <div className="grid grid-cols-6 gap-4.5">
        {items.map((it, i) => (
          <div className="flex flex-col gap-2 cursor-pointer transition-transform duration-120 relative hover:-translate-y-0.5" key={i}>
            <div style={{ position: "relative" }}>
              <BookCover book={it.book} size="md" style={{ width: "100%", aspectRatio: "2/3" }} />
              <div className="absolute top-2 right-2 w-6.5 h-6.5 bg-[rgba(0,0,0,0.55)] backdrop-blur-[6px] rounded-full flex items-center justify-center text-[#ffe767] z-2" aria-label="curtido">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 21s-7-4.35-9.5-9C.6 7.5 3 4 6.5 4c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3 3.5 0 5.9 3.5 4 8-2.5 4.65-9.5 9-9.5 9z" />
                </svg>
              </div>
            </div>
            <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight">{it.book.title}</div>
            <div className="text-[11px] text-(--ink-4) -mt-0.75">{it.book.author}</div>
            <div className="font-mono text-[10px] text-(--ink-5) tracking-[0.04em] mt-0.5">♡ {it.when}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default CurtidasTab;
