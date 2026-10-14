"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/shared/modal";
import {
  Button,
  FormActions,
  FormError,
  FormField,
  TextArea,
  TextInput,
} from "@/components/shared/form";
import { createList, updateList } from "@/lib/actions/lists";
import { useAction } from "@/components/reading/use-action";
import {
  VISIBILITY_HINT,
  VISIBILITY_LABEL,
  type Visibility,
} from "./visibility";

interface ListFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list?: {
    id: string;
    title: string;
    note: string | null;
    visibility: Visibility;
  };
  onCreated?: (id: string) => void;
  navigateOnCreate?: boolean;
}

export function VisibilityPicker({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
}) {
  return (
    <div className="mb-4">
      <span className="block font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase mb-1.5">
        Quem vê
      </span>
      <div className="grid grid-cols-3 gap-2" role="radiogroup">
        {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className="text-left rounded-[10px] border-[1.5px] border-[rgba(67,62,18,0.14)] bg-(--cream-card) px-3 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--yellow-soft) aria-checked:border-(--ink-2) aria-checked:bg-(--yellow-soft)"
          >
            <span className="block text-[13px] font-semibold text-(--ink-2)">
              {VISIBILITY_LABEL[v]}
            </span>
            <span className="block text-[11px] text-(--ink-4) leading-[1.35] mt-0.5">
              {VISIBILITY_HINT[v]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ListFormModal({
  open,
  onOpenChange,
  list,
  onCreated,
  navigateOnCreate = true,
}: ListFormModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(list?.title ?? "");
  const [note, setNote] = useState(list?.note ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    list?.visibility ?? "PUBLIC",
  );
  const { pending, error, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = { title, note, visibility };
    if (list) {
      run(
        () => updateList(list.id, input),
        () => onOpenChange(false),
      );
      return;
    }
    run(
      () => createList(input),
      (data) => {
        onOpenChange(false);
        if (!data) return;
        onCreated?.(data.id);
        if (navigateOnCreate) router.push(`/lists/${data.id}`);
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Estantes"
      title={list ? "Editar lista" : "Criar nova estante"}
      width={560}
    >
      <form onSubmit={submit}>
        <FormError message={error} />
        <FormField label="Nome">
          <TextInput
            value={title}
            maxLength={80}
            required
            autoFocus
            placeholder="Brasileiras que mudam o ano"
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>
        <FormField label="Descrição" hint="Opcional">
          <TextArea
            value={note}
            maxLength={300}
            placeholder="Do que se trata essa lista?"
            onChange={(e) => setNote(e.target.value)}
          />
        </FormField>
        <VisibilityPicker value={visibility} onChange={setVisibility} />
        {list?.visibility === "SHARED" && visibility !== "SHARED" && (
          <p className="m-0 -mt-1 text-[12px] text-[#9a4a2a]">
            Quem você convidou vai perder acesso à lista.
          </p>
        )}
        <FormActions>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            {list ? "Salvar" : "Criar lista"}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
