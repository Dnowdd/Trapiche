"use client";

import { useState } from "react";
import Modal from "@/components/shared/modal";
import BookCover from "@/components/shared/book-cover";
import { Button, FormActions, FormError } from "@/components/shared/form";
import { useAction } from "@/components/reading/use-action";
import { toast } from "@/components/shared/toast";
import { saveFavorites } from "@/lib/actions/shelf";
import type { Book } from "@/lib/types/book";

export default function FavoritesEditor({ favorites }: { favorites: Book[] }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(favorites);
  const { pending, error, run } = useAction();

  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setItems(next);
  };

  const iconBtn =
    "w-8 h-8 rounded-lg border border-[rgba(67,62,18,0.15)] flex items-center justify-center text-(--ink-3) cursor-pointer hover:bg-(--yellow-soft) hover:text-(--ink-2) disabled:opacity-30 disabled:cursor-default";

  return (
    <>
      <button
        type="button"
        className="text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px cursor-pointer hover:text-(--ink)"
        onClick={() => {
          setItems(favorites);
          setOpen(true);
        }}
      >
        Editar →
      </button>
      {open && (
        <Modal
          open
          onOpenChange={setOpen}
          eyebrow="Curadoria do leitor"
          title="Seus 5 favoritos"
          description="Mude a ordem ou tire livros. Para adicionar, abra o livro e clique em “Adicionar aos favoritos”."
          width={520}
        >
          <FormError message={error} />
          {items.length === 0 ? (
            <p className="m-0 text-[13px] text-(--ink-4)">
              Nenhum favorito. Salve para limpar a lista.
            </p>
          ) : (
            <ol className="m-0 p-0 list-none flex flex-col gap-2">
              {items.map((b, i) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[10px] py-2 px-3"
                >
                  <span className="font-mono text-[11px] text-(--ink-4) w-6">
                    0{i + 1}
                  </span>
                  <BookCover
                    book={b}
                    size="sm"
                    style={{
                      width: 28,
                      height: 42,
                      padding: 3,
                      borderRadius: 2,
                    }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-(--ink-2) truncate">
                      {b.title}
                    </span>
                    <span className="block text-[11px] text-(--ink-4) truncate">
                      {b.author}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label="Subir"
                    className={iconBtn}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Descer"
                    className={iconBtn}
                    disabled={i === items.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label="Tirar dos favoritos"
                    className={iconBtn}
                    onClick={() => setItems(items.filter((x) => x.id !== b.id))}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ol>
          )}
          <FormActions>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              loading={pending}
              onClick={() =>
                run(
                  () => saveFavorites(items.map((b) => b.id)),
                  () => {
                    setOpen(false);
                    toast("Favoritos atualizados.");
                  },
                )
              }
            >
              Salvar
            </Button>
          </FormActions>
        </Modal>
      )}
    </>
  );
}
