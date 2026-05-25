"use client";

import { useState } from "react";
import { LISTS_FULL } from "../mock-profile";
import BookCover from "@/components/shared/book-cover";
import Chips from "@/components/shared/chips";
import type React from "react";

type ListItem = (typeof LISTS_FULL)[number];

const STACK_POSITIONS: React.CSSProperties[] = [
  { position: "absolute", bottom: 14, width: 95, height: 140, borderRadius: 3, boxShadow: "0 10px 16px -8px rgba(67,62,18,0.45)", left: "20%", transform: "translateX(-50%) rotate(-9deg)", zIndex: 1 },
  { position: "absolute", bottom: 14, width: 95, height: 140, borderRadius: 3, boxShadow: "0 10px 16px -8px rgba(67,62,18,0.45)", left: "40%", transform: "translateX(-50%) rotate(-3deg)", zIndex: 2 },
  { position: "absolute", bottom: 14, width: 95, height: 140, borderRadius: 3, boxShadow: "0 10px 16px -8px rgba(67,62,18,0.45)", left: "60%", transform: "translateX(-50%) rotate(3deg)", zIndex: 3 },
  { position: "absolute", bottom: 14, width: 95, height: 140, borderRadius: 3, boxShadow: "0 10px 16px -8px rgba(67,62,18,0.45)", left: "80%", transform: "translateX(-50%) rotate(9deg)", zIndex: 4 },
];

const ListCardRich = ({ list }: { list: ListItem }) => {
  const books = list.books.slice(0, 4);

  return (
    <div className={`bg-(--cream-card) border rounded-[18px] p-4.5 flex flex-col gap-3.5 transition-[transform,box-shadow] duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(67,62,18,0.04),0_24px_60px_-28px_rgba(67,62,18,0.3)] ${list.pinned ? "border-(--ink-2)" : "border-[rgba(67,62,18,0.08)]"}`}>
      <div className="h-42.5 relative rounded-[10px] overflow-hidden bg-(--yellow-soft)">
        <div className="absolute top-3 right-3 font-mono text-[10px] bg-(--ink-2) text-(--yellow) py-1 px-2.5 rounded-full tracking-[0.04em] z-5">
          {list.count} livros
        </div>
        {books.map((b, i) => (
          <BookCover key={i} book={b} size="sm" style={STACK_POSITIONS[i]} />
        ))}
      </div>
      <div>
        <div className="font-mono text-[10px] text-(--ink-4) uppercase tracking-[0.06em] flex gap-2 items-center">
          {list.pinned && (
            <>
              <span className="inline-flex items-center gap-1 text-(--ink-2) tracking-[0.04em]">◉ Fixada</span>
              <span className="text-(--ink-5)">·</span>
            </>
          )}
          <span>{list.kind}</span>
        </div>
        <div className="text-[16px] font-bold text-(--ink-2) tracking-[-0.01em] leading-[1.2] mt-1">{list.title}</div>
        {list.note && <div className="text-[12px] text-(--ink-4) leading-[1.45] mt-1.5">{list.note}</div>}
      </div>
      <div className="flex items-center justify-between border-t border-(--rule) pt-3 mt-auto text-[11px]">
        <div className="flex items-center gap-1.5 text-(--ink-3)">
          <span className="w-4.5 h-4.5 rounded-full bg-(--cream-deep) border border-(--ink-3) text-[9px] font-bold flex items-center justify-center text-(--ink-2)">{list.byInitials}</span>
          Por <strong className="text-(--ink-2) font-semibold">{list.by}</strong>
        </div>
        <span className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em]">{list.updated}</span>
      </div>
    </div>
  );
};

const ListasTab = () => {
  const [filter, setFilter] = useState("todas");
  const all = LISTS_FULL;
  const minhas = all.filter((l) => l.by === "Você");
  const compartilhadas = all.filter((l) => l.kind === "Compartilhada");
  const privadas = all.filter((l) => l.kind === "Privada");

  const list =
    filter === "minhas"
      ? minhas
      : filter === "compartilhadas"
        ? compartilhadas
        : filter === "privadas"
          ? privadas
          : all;

  const pinned = list.filter((l) => l.pinned);
  const others = list.filter((l) => !l.pinned);

  return (
    <>
      <Chips
        label="Mostrar"
        value={filter}
        onChange={setFilter}
        options={[
          { id: "todas", label: "Todas", count: all.length },
          { id: "minhas", label: "Minhas", count: minhas.length },
          { id: "compartilhadas", label: "Compartilhadas", count: compartilhadas.length },
          { id: "privadas", label: "Privadas", count: privadas.length },
        ]}
      />

      {pinned.length > 0 && (
        <>
          <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-3) mb-3.5">
            <span>◉ Fixadas</span>
            <span className="flex-1 h-px bg-(--rule)"></span>
          </div>
          <div className="grid grid-cols-3 gap-5 mb-6">
            {pinned.map((l) => (
              <ListCardRich key={l.id} list={l} />
            ))}
            {pinned.length < 3 &&
              Array.from({ length: 3 - pinned.length }, (_, i) => (
                <div key={i} />
              ))}
          </div>
        </>
      )}

      <div
        className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-3) mb-3.5"
        style={{ marginTop: pinned.length > 0 ? 24 : 0 }}
      >
        <span>{filter === "todas" ? "Todas as estantes" : "Resultados"}</span>
        <span className="flex-1 h-px bg-(--rule)"></span>
      </div>
      <div className="grid grid-cols-3 gap-5 mb-6">
        {others.map((l) => (
          <ListCardRich key={l.id} list={l} />
        ))}
        <div className="bg-transparent border-[1.5px] border-dashed border-[rgba(67,62,18,0.22)] rounded-[18px] p-4.5 flex flex-col items-center justify-center min-h-95 text-center gap-2 cursor-pointer transition-colors duration-150 hover:bg-(--yellow-soft)">
          <div className="text-[36px] font-light text-(--ink-3) leading-[0.8]">+</div>
          <div className="text-[14px] font-semibold text-(--ink-2)">Criar nova estante</div>
          <div className="text-[12px] text-(--ink-4) max-w-55 leading-[1.4]">
            Estantes podem ser privadas, públicas ou compartilhadas com amigos.
          </div>
        </div>
      </div>
    </>
  );
};

export default ListasTab;
