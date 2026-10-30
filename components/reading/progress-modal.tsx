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
import { updateProgress } from "@/lib/actions/shelf";
import { useAction } from "./use-action";
import PartialDateInput from "./partial-date-input";

export function PageCountField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField
      label="Total de páginas"
      hint="Esse livro veio sem o número de páginas. Se souber, conta pra gente."
    >
      <TextInput
        type="number"
        inputMode="numeric"
        min={1}
        max={10000}
        value={value}
        placeholder="Ex.: 320"
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}

interface ProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  today: string;
  currentPage: number;
  pageCount: number | null;
  startedAt: string;
  note: string | null;
}

export default function ProgressModal({
  open,
  onOpenChange,
  bookId,
  today,
  currentPage,
  pageCount,
  startedAt,
  note: initialNote,
}: ProgressModalProps) {
  const [page, setPage] = useState(String(currentPage));
  const [start, setStart] = useState<string | null>(startedAt);
  const [total, setTotal] = useState("");
  const [note, setNote] = useState(initialNote ?? "");
  const { pending, error, run } = useAction();
  const invalid = start === null || start > today.slice(0, start.length);
  const max = pageCount ?? (Number(total) || undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    run(
      () =>
        updateProgress(bookId, {
          currentPage: page,
          startedAt: start,
          note,
          pageCount: pageCount ? null : total,
        }),
      () => onOpenChange(false),
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Sua leitura"
      title="Editar progresso"
      description="Corrija a página atual, quando começou ou a sua nota. A data é opcional: pode ser só o ano, o mês ou o dia certinho."
    >
      <form onSubmit={submit}>
        <FormError message={error} />
        <div className="grid grid-cols-2 gap-3.5">
          <FormField
            label="Página atual"
            hint={pageCount ? `de ${pageCount}` : undefined}
          >
            <TextInput
              type="number"
              inputMode="numeric"
              min={0}
              max={max}
              required
              value={page}
              onChange={(e) => setPage(e.target.value)}
            />
          </FormField>
          {pageCount ? (
            <PartialDateInput
              label="Começou em"
              value={start}
              onChange={setStart}
              today={today}
            />
          ) : (
            <PageCountField value={total} onChange={setTotal} />
          )}
        </div>
        {!pageCount && (
          <PartialDateInput
            label="Começou em"
            value={start}
            onChange={setStart}
            today={today}
          />
        )}
        <FormField
          label="Nota da leitura"
          hint="Aparece no card “Sua leitura”."
        >
          <TextArea
            value={note}
            maxLength={500}
            placeholder="Reli o capítulo do Sem-Pernas duas vezes…"
            onChange={(e) => setNote(e.target.value)}
          />
        </FormField>
        <FormActions>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={pending} disabled={invalid}>
            Salvar
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
