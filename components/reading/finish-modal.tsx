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
import { toast } from "@/components/shared/toast";
import PartialDateInput from "./partial-date-input";
import { StarPicker } from "./review-modal";
import { useAction } from "./use-action";

interface FinishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  title: string;
  today: string;
  startedAt?: string | null;
  review?: { rating: number; text: string; spoiler?: boolean } | null;
  onFinished?: () => void;
}

export default function FinishModal({
  open,
  onOpenChange,
  bookId,
  title,
  today,
  startedAt,
  review,
  onFinished,
}: FinishModalProps) {
  const [start, setStart] = useState<string | null>(startedAt ?? "");
  const [end, setEnd] = useState<string | null>("");
  const invalid =
    start === null ||
    end === null ||
    start > today.slice(0, start.length) ||
    end > today.slice(0, end.length);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [text, setText] = useState(review?.text ?? "");
  const [spoiler, setSpoiler] = useState(review?.spoiler ?? false);
  const { pending, error, setError, run } = useAction();
  const reviewChanged =
    rating !== (review?.rating ?? 0) ||
    text.trim() !== (review?.text ?? "").trim() ||
    spoiler !== (review?.spoiler ?? false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    if (text.trim() && !rating) {
      setError("Escolha uma nota para publicar a resenha.");
      return;
    }
    const sendReview = rating > 0 && reviewChanged;
    run(
      () =>
        finishBook(bookId, {
          startedAt: start ?? "",
          finishedAt: end ?? "",
          review: sendReview ? { rating, text, spoiler } : undefined,
        }),
      () => {
        onOpenChange(false);
        if (sendReview)
          toast(review ? "Resenha atualizada." : "Resenha publicada.");
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
      description="Tudo aqui é opcional. Nas datas, preencha só o que lembrar: o ano, o mês ou o dia certinho."
      width={560}
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
        <div className="mb-4">
          <span className="block font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase mb-1.5">
            Sua nota
          </span>
          <StarPicker
            value={rating}
            onChange={(v) => {
              setRating(v);
              setError("");
            }}
          />
        </div>
        <FormField
          label="Resenha"
          hint={`Opcional. Fica pública no livro e no seu perfil. ${text.length}/5000`}
        >
          <TextArea
            value={text}
            maxLength={5000}
            className="min-h-32"
            placeholder="Conte o que ficou com você…"
            onChange={(e) => setText(e.target.value)}
          />
        </FormField>
        {text.trim() && (
          <label className="flex items-center gap-2 -mt-1 mb-4 text-[13px] text-(--ink-2) cursor-pointer select-none">
            <input
              type="checkbox"
              checked={spoiler}
              onChange={(e) => setSpoiler(e.target.checked)}
              className="size-4 accent-(--yellow-deep)"
            />
            Contém spoiler
          </label>
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
            Marcar como lido
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
