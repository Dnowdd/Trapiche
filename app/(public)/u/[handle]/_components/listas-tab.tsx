"use client";

import { useState } from "react";
import Link from "next/link";
import type React from "react";
import BookCover from "@/components/shared/book-cover";
import Chips from "@/components/shared/chips";
import ListFormModal from "@/components/lists/list-form-modal";
import { VISIBILITY_LABEL } from "@/components/lists/visibility";
import type { getListas } from "@/lib/queries/profile";

type ListItem = Awaited<ReturnType<typeof getListas>>[number];

const ROTATIONS = ["-9deg", "-3deg", "3deg", "9deg"];

const stackStyle = (i: number): React.CSSProperties => ({
  position: "absolute",
  bottom: 14,
  width: 95,
  height: 140,
  borderRadius: 3,
  boxShadow: "0 10px 16px -8px rgba(67,62,18,0.45)",
  left: `${20 + i * 20}%`,
  transform: `translateX(-50%) rotate(${ROTATIONS[i]})`,
  zIndex: i + 1,
});

const ListCardRich = ({ list }: { list: ListItem }) => (
  <Link
    href={`/lists/${list.id}`}
    className={`bg-(--cream-card) border rounded-[18px] p-4.5 flex flex-col gap-3.5 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(67,62,18,0.04),0_24px_60px_-28px_rgba(67,62,18,0.3)] ${list.pinned ? "border-(--ink-2)" : "border-[rgba(67,62,18,0.08)]"}`}
  >
    <div className="h-42.5 relative rounded-[10px] overflow-hidden bg-(--yellow-soft)">
      <div className="absolute top-3 right-3 font-mono text-[10px] bg-(--ink-2) text-(--yellow) py-1 px-2.5 rounded-full tracking-[0.04em] z-5">
        {list.count} {list.count === 1 ? "livro" : "livros"}
      </div>
      {list.books.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.06em] text-(--ink-4)">
          lista vazia
        </div>
      )}
      {list.books.map((b, i) => (
        <BookCover key={b.id} book={b} size="sm" style={stackStyle(i)} />
      ))}
    </div>
    <div>
      <div className="font-mono text-[10px] text-(--ink-4) uppercase tracking-[0.06em] flex gap-2 items-center">
        {list.pinned && (
          <>
            <span className="inline-flex items-center gap-1 text-(--ink-2) tracking-[0.04em]">
              ◉ Fixada
            </span>
            <span className="text-(--ink-5)">·</span>
          </>
        )}
        <span>
          {list.following ? "Seguindo" : VISIBILITY_LABEL[list.visibility]}
        </span>
      </div>
      <div className="text-[16px] font-bold text-(--ink-2) tracking-[-0.01em] leading-[1.2] mt-1">
        {list.title}
      </div>
      {list.note && (
        <div className="text-[12px] text-(--ink-4) leading-[1.45] mt-1.5">
          {list.note}
        </div>
      )}
    </div>
    <div className="flex items-center justify-between border-t border-(--rule) pt-3 mt-auto text-[11px]">
      <div className="flex items-center gap-1.5 text-(--ink-3)">
        <span className="w-4.5 h-4.5 rounded-full bg-(--cream-deep) border border-(--ink-3) text-[9px] font-bold flex items-center justify-center text-(--ink-2)">
          {list.byInitials}
        </span>
        Por <strong className="text-(--ink-2) font-semibold">{list.by}</strong>
      </div>
      <span className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em]">
        {list.updated}
      </span>
    </div>
  </Link>
);

export default function ListasTab({
  items,
  isOwner,
}: {
  items: ListItem[];
  isOwner: boolean;
}) {
  const [filter, setFilter] = useState("todas");
  const [creating, setCreating] = useState(false);
  const own = items.filter((l) => !l.following);
  const minhas = own.filter((l) => l.mine);
  const compartilhadas = own.filter((l) => l.visibility === "SHARED");
  const privadas = own.filter((l) => l.visibility === "PRIVATE");
  const seguindo = items.filter((l) => l.following);

  const list =
    filter === "minhas"
      ? minhas
      : filter === "compartilhadas"
        ? compartilhadas
        : filter === "privadas"
          ? privadas
          : filter === "seguindo"
            ? seguindo
            : own;

  const pinned = list.filter((l) => l.pinned);
  const others = list.filter((l) => !l.pinned);

  const options = [
    { id: "todas", label: "Todas", count: own.length },
    { id: "minhas", label: "Minhas", count: minhas.length },
    {
      id: "compartilhadas",
      label: "Compartilhadas",
      count: compartilhadas.length,
    },
    ...(isOwner
      ? [
          { id: "privadas", label: "Privadas", count: privadas.length },
          { id: "seguindo", label: "Seguindo", count: seguindo.length },
        ]
      : []),
  ];

  return (
    <>
      <Chips
        label="Mostrar"
        value={filter}
        onChange={setFilter}
        options={options}
      />

      {pinned.length > 0 && (
        <>
          <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-3) mb-3.5">
            <span>◉ Fixadas</span>
            <span className="flex-1 h-px bg-(--rule)" />
          </div>
          <div className="grid grid-cols-3 gap-5 mb-6">
            {pinned.map((l) => (
              <ListCardRich key={l.id} list={l} />
            ))}
          </div>
        </>
      )}

      <div
        className={`flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-3) mb-3.5 ${pinned.length > 0 ? "mt-6" : ""}`}
      >
        <span>{filter === "todas" ? "Todas as estantes" : "Resultados"}</span>
        <span className="flex-1 h-px bg-(--rule)" />
      </div>
      <div className="grid grid-cols-3 gap-5 mb-6">
        {others.map((l) => (
          <ListCardRich key={l.id} list={l} />
        ))}
        {isOwner && filter !== "seguindo" && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="bg-transparent border-[1.5px] border-dashed border-[rgba(67,62,18,0.22)] rounded-[18px] p-4.5 flex flex-col items-center justify-center min-h-95 text-center gap-2 cursor-pointer transition-colors duration-150 hover:bg-(--yellow-soft)"
          >
            <span className="text-[36px] font-light text-(--ink-3) leading-[0.8]">
              +
            </span>
            <span className="text-[14px] font-semibold text-(--ink-2)">
              Criar nova estante
            </span>
            <span className="text-[12px] text-(--ink-4) max-w-55 leading-[1.4]">
              Estantes podem ser privadas, públicas ou compartilhadas com
              amigos.
            </span>
          </button>
        )}
        {!isOwner && others.length === 0 && pinned.length === 0 && (
          <p className="m-0 text-[14px] text-(--ink-4) col-span-3">
            Nenhuma lista pública ainda.
          </p>
        )}
        {isOwner && filter === "seguindo" && seguindo.length === 0 && (
          <p className="m-0 text-[14px] text-(--ink-4) col-span-3">
            Você ainda não segue nenhuma lista. Abra uma lista pública da
            comunidade e clique em “Seguir lista”.
          </p>
        )}
      </div>
      {creating && <ListFormModal open onOpenChange={setCreating} />}
    </>
  );
}
