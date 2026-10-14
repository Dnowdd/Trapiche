"use client";

import { useState } from "react";
import Modal from "@/components/shared/modal";
import {
  Button,
  FormActions,
  FormError,
  FormField,
  TextArea,
  TextInput,
} from "@/components/shared/form";
import { abandonBook } from "@/lib/actions/shelf";
import { useAction } from "./use-action";

interface AbandonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  title: string;
  currentPage: number;
  pageCount: number | null;
}

export default function AbandonModal({
  open,
  onOpenChange,
  bookId,
  title,
  currentPage,
  pageCount,
}: AbandonModalProps) {
  const [page, setPage] = useState(String(currentPage || ""));
  const [reason, setReason] = useState("");
  const [again, setAgain] = useState(true);
  const { pending, error, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () =>
        abandonBook(bookId, {
          page: page || 0,
          reason,
          wantsToReturn: again,
        }),
      () => onOpenChange(false),
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Sem culpa"
      title={`Abandonar ${title}?`}
      description="Abandonar também é leitura. O livro vai para a aba Abandonos do seu perfil."
    >
      <form onSubmit={submit}>
        <FormError message={error} />
        <FormField
          label="Parou em qual página?"
          hint={pageCount ? `O livro tem ${pageCount} páginas.` : undefined}
        >
          <TextInput
            type="number"
            min={0}
            max={pageCount ?? undefined}
            inputMode="numeric"
            value={page}
            placeholder="0"
            onChange={(e) => setPage(e.target.value)}
          />
        </FormField>
        <FormField label="Por quê?" hint="Opcional. Aparece no seu perfil.">
          <TextArea
            value={reason}
            maxLength={500}
            placeholder="Só não engatou, não era o momento…"
            onChange={(e) => setReason(e.target.value)}
          />
        </FormField>
        <div
          className="flex gap-2"
          role="radiogroup"
          aria-label="Pretende voltar?"
        >
          {[
            { v: true, label: "Pretendo voltar" },
            { v: false, label: "Não pretendo" },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              role="radio"
              aria-checked={again === o.v}
              onClick={() => setAgain(o.v)}
              className="text-[12px] font-medium py-2 px-3.5 rounded-full border border-[rgba(67,62,18,0.15)] text-(--ink-3) cursor-pointer hover:bg-(--yellow-soft) aria-checked:bg-(--ink-2) aria-checked:text-(--yellow) aria-checked:border-(--ink-2)"
            >
              {o.label}
            </button>
          ))}
        </div>
        <FormActions>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            Abandonar
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
