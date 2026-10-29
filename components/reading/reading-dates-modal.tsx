"use client";

import { useState } from "react";
import Modal from "@/components/shared/modal";
import { Button, FormActions, FormError } from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { addPastReading, updateReading } from "@/lib/actions/shelf";
import PartialDateInput from "./partial-date-input";
import { useAction } from "./use-action";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  today: string;
  title: string;
} & (
  | { mode: "add"; bookId: string }
  | {
      mode: "edit";
      readingId: string;
      number: number;
      abandoned: boolean;
      startedAt: string;
      endedAt: string;
    }
);

export default function ReadingDatesModal(props: Props) {
  const { open, onOpenChange, today, title } = props;
  const editing = props.mode === "edit";
  const abandoned = editing && props.abandoned;
  const [start, setStart] = useState<string | null>(
    editing ? props.startedAt : "",
  );
  const [end, setEnd] = useState<string | null>(editing ? props.endedAt : "");
  const { pending, error, run } = useAction();

  const future = (v: string) => v > today.slice(0, v.length);
  const invalid =
    start === null ||
    end === null ||
    future(start) ||
    (!abandoned && future(end));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    const dates = { startedAt: start ?? "", finishedAt: end ?? "" };
    run(
      () =>
        props.mode === "edit"
          ? updateReading(props.readingId, dates)
          : addPastReading(props.bookId, dates),
      () => {
        onOpenChange(false);
        toast(editing ? "Leitura atualizada." : "Leitura registrada.");
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={editing ? `${props.number}ª leitura` : "Leitura anterior"}
      title={
        editing ? `Datas da leitura de ${title}` : `Quando você leu ${title}?`
      }
      description="As datas são opcionais. Pode ser só o ano, mês e ano ou a data completa."
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
          {!abandoned && (
            <PartialDateInput
              label="Terminou em"
              value={end}
              onChange={setEnd}
              today={today}
            />
          )}
        </div>
        <FormActions>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={pending} disabled={invalid}>
            {editing ? "Salvar" : "Registrar leitura"}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
