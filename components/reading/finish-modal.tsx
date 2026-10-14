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
import { finishBook } from "@/lib/actions/shelf";
import { useAction } from "./use-action";

interface FinishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  title: string;
  today: string;
  startedAt?: string | null;
  onFinished?: (days: number) => void;
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
  const [start, setStart] = useState(startedAt ?? "");
  const [end, setEnd] = useState(today);
  const [note, setNote] = useState("");
  const { pending, error, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () =>
        finishBook(bookId, {
          startedAt: start || undefined,
          finishedAt: end,
          note,
        }),
      (data) => {
        onOpenChange(false);
        onFinished?.(data?.days ?? 1);
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Leitura concluída"
      title={`Terminou ${title}?`}
      description="Registre quando você começou e terminou. Isso entra no seu diário e nas suas estatísticas."
    >
      <form onSubmit={submit}>
        <FormError message={error} />
        <div className="grid grid-cols-2 gap-3.5">
          <FormField
            label="Começou em"
            hint={startedAt ? undefined : "Opcional"}
          >
            <TextInput
              type="date"
              value={start}
              max={end || today}
              onChange={(e) => setStart(e.target.value)}
            />
          </FormField>
          <FormField label="Terminou em">
            <TextInput
              type="date"
              value={end}
              max={today}
              required
              onChange={(e) => setEnd(e.target.value)}
            />
          </FormField>
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
          <Button type="submit" loading={pending}>
            Marcar como lido
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
