"use client";

import { useState } from "react";
import { Settings2, Trash2 } from "lucide-react";
import Modal from "@/components/shared/modal";
import { Button, FormError, TextInput } from "@/components/shared/form";
import Switch from "@/components/shared/switch";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { createTag, deleteTag, updateTag } from "@/lib/actions/tags";
import { TAG_COLORS, TAG_NAME_MAX } from "@/lib/tags";
import { cn } from "@/lib/utils";

type Tag = {
  id: string;
  name: string;
  color: string;
  private: boolean;
  count: number;
};

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="Cor">
      {TAG_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className={cn(
            "size-6 rounded-full cursor-pointer transition-transform hover:scale-110",
            value === c &&
              "ring-2 ring-offset-2 ring-offset-(--cream) ring-(--ink-2)",
          )}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

function TagRow({ tag }: { tag: Tag }) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [isPrivate, setPrivate] = useState(tag.private);
  const { pending, error, run } = useAction();
  const removing = useAction();
  const dirty =
    name !== tag.name || color !== tag.color || isPrivate !== tag.private;

  return (
    <li className="py-4 flex flex-col gap-3">
      <FormError message={error || removing.error} />
      <div className="flex items-center gap-2.5">
        <TextInput
          value={name}
          maxLength={TAG_NAME_MAX}
          aria-label="Nome da tag"
          onChange={(e) => setName(e.target.value)}
          className="h-10 flex-1"
        />
        <span className="font-mono text-[10px] text-(--ink-4) w-14 text-right shrink-0">
          {tag.count} {tag.count === 1 ? "livro" : "livros"}
        </span>
        <button
          type="button"
          aria-label={`Apagar a tag ${tag.name}`}
          disabled={removing.pending}
          onClick={() => {
            if (
              !window.confirm(
                `Apagar a tag “${tag.name}”? Os livros continuam na estante.`,
              )
            )
              return;
            removing.run(
              () => deleteTag(tag.id),
              () => toast("Tag apagada."),
            );
          }}
          className="size-9 shrink-0 rounded-lg flex items-center justify-center text-(--ink-4) hover:text-(--danger) hover:bg-[rgba(154,74,42,0.06)] cursor-pointer"
        >
          <Trash2 size={15} />
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ColorPicker value={color} onChange={setColor} />
        <label className="flex items-center gap-2 text-[12.5px] text-(--ink-3) cursor-pointer">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setPrivate(e.target.checked)}
            className="size-4 accent-(--ink-2)"
          />
          Só eu vejo
        </label>
        {dirty && (
          <Button
            type="button"
            loading={pending}
            className="h-8 text-[12px]"
            onClick={() =>
              run(
                () => updateTag(tag.id, { name, color, private: isPrivate }),
                () => toast("Tag salva."),
              )
            }
          >
            Salvar
          </Button>
        )}
      </div>
    </li>
  );
}

export default function ManageTags({ tags }: { tags: Tag[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(TAG_COLORS[1]);
  const [isPrivate, setPrivate] = useState(false);
  const { pending, error, run } = useAction();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] text-(--ink-3) hover:bg-(--yellow-soft) hover:text-(--ink-2) cursor-pointer"
      >
        <Settings2 size={13} />
        {tags.length ? "Gerenciar" : "Criar tags"}
      </button>
      {open && (
        <Modal
          open
          onOpenChange={setOpen}
          eyebrow="Estante"
          title="Suas tags"
          description="Prateleiras do seu jeito. Marque um livro com uma tag na página dele."
          width={560}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () => createTag({ name, color, private: isPrivate }),
                () => {
                  setName("");
                  toast("Tag criada.");
                },
              );
            }}
            className="rounded-[14px] bg-(--cream-card) border border-[rgba(var(--ink-rgb),0.1)] p-4"
          >
            <FormError message={error} />
            <div className="flex gap-2.5">
              <TextInput
                value={name}
                maxLength={TAG_NAME_MAX}
                required
                placeholder="Nova tag: clube do livro, emprestados…"
                onChange={(e) => setName(e.target.value)}
                className="h-10 flex-1"
              />
              <Button type="submit" loading={pending} className="h-10">
                Criar
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <ColorPicker value={color} onChange={setColor} />
              <div className="min-w-48">
                <Switch
                  label="Só eu vejo"
                  checked={isPrivate}
                  onChange={setPrivate}
                />
              </div>
            </div>
          </form>
          {tags.length > 0 && (
            <ul className="m-0 mt-2 p-0 list-none divide-y divide-(--rule)">
              {tags.map((t) => (
                <TagRow
                  key={`${t.id}:${t.name}:${t.color}:${t.private}`}
                  tag={t}
                />
              ))}
            </ul>
          )}
        </Modal>
      )}
    </>
  );
}
