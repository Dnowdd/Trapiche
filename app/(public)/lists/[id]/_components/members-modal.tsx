"use client";

import { useState } from "react";
import Modal from "@/components/shared/modal";
import { Button, FormError, TextInput } from "@/components/shared/form";
import { useAction } from "@/components/reading/use-action";
import { addCollaborator, removeCollaborator } from "@/lib/actions/lists";
import type { ListPageData } from "@/lib/queries/lists";

export default function MembersModal({
  open,
  onOpenChange,
  list,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: ListPageData;
}) {
  const [handle, setHandle] = useState("");
  const { pending, error, run } = useAction();

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () => addCollaborator(list.id, handle),
      () => setHandle(""),
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Lista compartilhada"
      title="Quem cuida dessa lista"
      description="Pessoas convidadas veem a lista e podem adicionar ou tirar livros."
      width={500}
    >
      <FormError message={error} />
      <ul className="m-0 p-0 list-none flex flex-col gap-2 mb-5">
        {list.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center gap-3 bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[10px] py-2.5 px-3.5"
          >
            <span className="w-8 h-8 rounded-full bg-(--cream-deep) border border-(--ink-3) text-[11px] font-bold flex items-center justify-center text-(--ink-2)">
              {m.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-(--ink-2)">
                {m.name}
              </span>
              <span className="block font-mono text-[10px] text-(--ink-4)">
                @{m.handle} · {m.role === "OWNER" ? "dono" : "colabora"}
              </span>
            </span>
            {m.role !== "OWNER" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => removeCollaborator(list.id, m.id))}
                className="text-[12px] text-(--ink-4) underline underline-offset-2 cursor-pointer hover:text-[#9a4a2a]"
              >
                remover
              </button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex gap-2">
        <TextInput
          value={handle}
          placeholder="@usuario"
          autoComplete="off"
          onChange={(e) => setHandle(e.target.value)}
        />
        <Button type="submit" loading={pending} disabled={!handle.trim()}>
          Convidar
        </Button>
      </form>
    </Modal>
  );
}
