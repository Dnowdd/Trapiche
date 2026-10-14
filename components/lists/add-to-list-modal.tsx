"use client";

import { useState } from "react";
import Modal from "@/components/shared/modal";
import { Button, FormError, TextInput } from "@/components/shared/form";
import {
  addBookToList,
  createList,
  removeBookFromList,
} from "@/lib/actions/lists";
import { useAction } from "@/components/reading/use-action";
import type { ActionResult } from "@/lib/actions/result";
import { VISIBILITY_LABEL, type Visibility } from "./visibility";
import { VisibilityPicker } from "./list-form-modal";

export interface ListOption {
  id: string;
  title: string;
  visibility: Visibility;
  count: number;
  hasBook: boolean;
}

interface AddToListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  title: string;
  lists: ListOption[];
}

export default function AddToListModal({
  open,
  onOpenChange,
  bookId,
  title,
  lists,
}: AddToListModalProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState(lists.length === 0);
  const [newTitle, setNewTitle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const { pending, error, run } = useAction();

  const toggle = (l: ListOption) => {
    setBusy(l.id);
    run(
      () =>
        l.hasBook
          ? removeBookFromList(l.id, bookId)
          : addBookToList(l.id, bookId),
      () => setBusy(null),
      () => setBusy(null),
    );
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      async (): Promise<ActionResult> => {
        const created = await createList({ title: newTitle, visibility });
        if (!created.ok) return created;
        if (!created.data) return { ok: true };
        return addBookToList(created.data.id, bookId);
      },
      () => {
        setCreating(false);
        setNewTitle("");
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Listas"
      title="Adicionar a uma lista"
      description={`Escolha onde guardar ${title}.`}
      width={520}
    >
      <FormError message={error} />
      {lists.length > 0 && (
        <ul className="flex flex-col gap-2 m-0 p-0 list-none max-h-80 overflow-y-auto">
          {lists.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => toggle(l)}
                disabled={pending}
                aria-pressed={l.hasBook}
                className="w-full flex items-center gap-3.5 text-left bg-(--cream-card) border border-[rgba(67,62,18,0.08)] rounded-[10px] py-3 px-4 cursor-pointer transition-colors duration-120 hover:bg-(--yellow-soft) aria-pressed:border-(--ink-2) disabled:cursor-wait"
              >
                <span
                  className={`w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center shrink-0 ${l.hasBook ? "bg-(--yellow) border-(--yellow-deep)" : "border-[rgba(67,62,18,0.3)]"}`}
                >
                  {busy === l.id && pending ? (
                    <span className="w-2 h-2 rounded-full bg-(--ink-3) animate-pulse" />
                  ) : (
                    l.hasBook && (
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 12l5 5L20 6" />
                      </svg>
                    )
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-(--ink-2) truncate">
                    {l.title}
                  </span>
                  <span className="block font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase mt-0.5">
                    {VISIBILITY_LABEL[l.visibility]} · {l.count}{" "}
                    {l.count === 1 ? "livro" : "livros"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <form onSubmit={create} className="mt-4 pt-4 border-t border-(--rule)">
          <span className="block font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase mb-1">
            Nova lista
          </span>
          <TextInput
            value={newTitle}
            maxLength={80}
            required
            autoFocus
            placeholder="Nome da lista"
            onChange={(e) => setNewTitle(e.target.value)}
            className="mb-3"
          />
          <VisibilityPicker value={visibility} onChange={setVisibility} />
          <div className="flex justify-end gap-2.5">
            {lists.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreating(false)}
              >
                Cancelar
              </Button>
            )}
            <Button type="submit" loading={pending}>
              Criar e adicionar
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mt-3 w-full border-[1.5px] border-dashed border-[rgba(67,62,18,0.22)] rounded-[10px] py-3 text-[13px] font-semibold text-(--ink-2) cursor-pointer hover:bg-(--yellow-soft)"
        >
          + Criar nova lista
        </button>
      )}
    </Modal>
  );
}
