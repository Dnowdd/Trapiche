"use client";

import { useState } from "react";
import Modal from "@/components/shared/modal";
import {
  Button,
  FormActions,
  FormError,
  FormField,
  TextInput,
} from "@/components/shared/form";
import { updateProgress } from "@/lib/actions/shelf";
import { fmtDuration, type ReadingFormat } from "@/lib/progress";
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

export function DurationField({
  label,
  value,
  onChange,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  required?: boolean;
}) {
  return (
    <FormField label={label} hint={hint ?? "Ex.: 2h15, 2:15 ou 135 (minutos)."}>
      <TextInput
        inputMode="text"
        required={required}
        value={value}
        placeholder="2h15"
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}

export function PercentField({
  value,
  onChange,
  label = "Porcentagem lida",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <FormField label={label} hint="O número que o leitor de e-book mostra.">
      <TextInput
        type="number"
        inputMode="decimal"
        min={0}
        max={100}
        step="0.1"
        required
        value={value}
        placeholder="45"
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
  format?: ReadingFormat;
  progressPercent?: number | null;
  audioPosition?: number | null;
  audioLength?: number | null;
}

export default function ProgressModal({
  open,
  onOpenChange,
  bookId,
  today,
  currentPage,
  pageCount,
  startedAt,
  format = "PRINT",
  progressPercent = null,
  audioPosition = null,
  audioLength = null,
}: ProgressModalProps) {
  const [page, setPage] = useState(String(currentPage));
  const [percent, setPercent] = useState(
    progressPercent != null ? String(progressPercent) : "",
  );
  const [position, setPosition] = useState(
    audioPosition ? fmtDuration(audioPosition) : "",
  );
  const [length, setLength] = useState(
    audioLength ? fmtDuration(audioLength) : "",
  );
  const [start, setStart] = useState<string | null>(startedAt);
  const [total, setTotal] = useState("");
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
          percent,
          audioPosition: position,
          audioLength: format === "AUDIO" ? length : undefined,
          startedAt: start,
          pageCount: pageCount || format !== "PRINT" ? null : total,
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
      description={
        format === "AUDIO"
          ? "Atualize até onde ouviu e quando começou. A data pode ser só o ano, o mês ou o dia."
          : format === "EBOOK"
            ? "Atualize a porcentagem e quando começou. A data pode ser só o ano, o mês ou o dia."
            : "Corrija a página atual ou quando começou. A data é opcional: pode ser só o ano, o mês ou o dia certinho."
      }
    >
      <form onSubmit={submit}>
        <FormError message={error} />
        {format === "EBOOK" ? (
          <>
            <PercentField value={percent} onChange={setPercent} />
            <PartialDateInput
              label="Começou em"
              value={start}
              onChange={setStart}
              today={today}
            />
          </>
        ) : format === "AUDIO" ? (
          <>
            <div className="grid grid-cols-2 gap-3.5">
              <DurationField
                label="Ouvi até"
                value={position}
                onChange={setPosition}
                required
              />
              <DurationField
                label="Duração total"
                value={length}
                onChange={setLength}
                hint="Opcional. Com ela, a gente calcula o %."
              />
            </div>
            <PartialDateInput
              label="Começou em"
              value={start}
              onChange={setStart}
              today={today}
            />
          </>
        ) : (
          <>
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
          </>
        )}
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
