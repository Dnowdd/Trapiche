"use client";

import { useState } from "react";
import Modal from "@/components/shared/modal";
import { Button, FormActions } from "@/components/shared/form";
import PartialDateInput from "./partial-date-input";

export default function StartModal({
  title,
  today,
  rereading = false,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  today: string;
  rereading?: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (startedAt: string) => void;
}) {
  const [start, setStart] = useState<string | null>(today);
  const invalid = start === null || start > today.slice(0, start.length);

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onCancel()}
      eyebrow={rereading ? "Releitura" : "Lendo agora"}
      title={rereading ? `Voltou a ${title}?` : `Começou a ler ${title}?`}
      description="Quando você começou? É opcional: pode ser só o ano, o mês ou o dia certinho. Deixe em branco se não lembrar."
      width={440}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!invalid) onConfirm(start ?? "");
        }}
      >
        <PartialDateInput
          label="Comecei em"
          value={start}
          onChange={setStart}
          today={today}
        />
        <FormActions>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="yellow"
            loading={pending}
            disabled={invalid}
          >
            {rereading ? "Começar releitura" : "Comecei"}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
