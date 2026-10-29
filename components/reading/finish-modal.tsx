"use client";

import { useState } from "react";
import Modal from "@/components/shared/modal";
import {
  Button,
  FormActions,
  FormError,
  FormField,
  TextArea,
} from "@/components/shared/form";
import { finishBook } from "@/lib/actions/shelf";
import PartialDateInput from "./partial-date-input";
import { useAction } from "./use-action";

interface FinishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  title: string;
  today: string;
  startedAt?: string | null;
  onFinished?: () => void;
}

export default function FinishModal({
  open,
  onOpenChange,
  bookId,
  title,
  today,
  startedAt,
  onFinished,
}: FinishModalProps) {
  const [start, setStart] = useState<string | null>(startedAt ?? "");
  const [end, setEnd] = useState<string | null>("");
  const invalid =
    start === null ||
    end === null ||
    start > today.slice(0, start.length) ||
    end > today.slice(0, end.length);
  const [note, setNote] = useState("");
  const { pending, error, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    run(
      () =>
        finishBook(bookId, {
          startedAt: start ?? "",
          finishedAt: end ?? "",
          note,
        }),
      () => {
        onOpenChange(false);
        onFinished?.();
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Leitura concluída"
      title={`Terminou ${title}?`}
      description="As datas são opcionais. Preencha só o que lembrar: o ano, o mês ou o dia certinho."
    >
      <form onSubmit={submit}>
        <FormError message={error} />
        <div className="grid sm:grid-cols-2 gap-x-4">
          <PartialDateInput
            label="Começou em"
            value={start}
            onChange={setStart}
            today={today}
          />
          <PartialDateInput
            label="Terminou em"
            value={end}
            onChange={setEnd}
            today={today}
          />
        </div>
        <FormField label="Uma nota sobre a leitura" hint="Opcional">
          <TextArea
            value={note}
            maxLength={500}
            placeholder="O que ficou com você?"
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
            Marcar como lido
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
