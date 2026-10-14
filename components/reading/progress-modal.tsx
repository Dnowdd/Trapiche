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
  const [start, setStart] = useState(startedAt);
  const [note, setNote] = useState(initialNote ?? "");
  const { pending, error, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () =>
        updateProgress(bookId, { currentPage: page, startedAt: start, note }),
      () => onOpenChange(false),
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Sua leitura"
      title="Editar progresso"
      description="Corrija a página atual, a data de início ou a sua nota. Para registrar tempo de leitura, use “Registrar leitura de hoje”."
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
              max={pageCount ?? undefined}
              required
              value={page}
              onChange={(e) => setPage(e.target.value)}
            />
          </FormField>
          <FormField label="Começou em">
            <TextInput
              type="date"
              value={start}
              max={today}
              required
              onChange={(e) => setStart(e.target.value)}
            />
          </FormField>
        </div>
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
          <Button type="submit" loading={pending}>
            Salvar
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
