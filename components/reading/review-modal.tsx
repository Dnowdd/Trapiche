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
import { saveReview } from "@/lib/actions/reviews";
import { toast } from "@/components/shared/toast";
import { useAction } from "./use-action";
import { Star, fmtRating, starFill } from "@/components/shared/stars";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  title: string;
  initial?: { rating: number; text: string; spoiler?: boolean } | null;
  eyebrow?: string;
}

export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const step = (delta: number) =>
    onChange(Math.min(5, Math.max(0.5, (value || 0) + delta)));

  return (
    <div className="flex items-center gap-3">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Nota"
        aria-valuemin={0.5}
        aria-valuemax={5}
        aria-valuenow={value || undefined}
        aria-valuetext={value ? `${fmtRating(value)} estrelas` : "Sem nota"}
        className="flex text-[32px] leading-none tracking-[-1px] text-(--ink-2) rounded-md outline-none focus-visible:ring-2 focus-visible:ring-(--yellow-deep)"
        onMouseLeave={() => setHover(0)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            step(0.5);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            step(-0.5);
          }
        }}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="relative cursor-pointer">
            <Star fill={starFill(shown, n - 1)} />
            {[n - 0.5, n].map((v, half) => (
              <button
                key={v}
                type="button"
                tabIndex={-1}
                aria-hidden
                className={`absolute inset-y-0 w-1/2 cursor-pointer ${half ? "right-0" : "left-0"}`}
                onMouseEnter={() => setHover(v)}
                onClick={() => onChange(v)}
              />
            ))}
          </span>
        ))}
      </div>
      <span className="text-[15px] font-bold text-(--ink-2) tabular-nums min-w-8">
        {shown ? fmtRating(shown) : ""}
      </span>
    </div>
  );
}

export default function ReviewModal({
  open,
  onOpenChange,
  bookId,
  title,
  initial,
  eyebrow = "Sua resenha",
}: ReviewModalProps) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [text, setText] = useState(initial?.text ?? "");
  const [spoiler, setSpoiler] = useState(initial?.spoiler ?? false);
  const { pending, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError("Escolha uma nota de meia a 5 estrelas.");
      return;
    }
    run(
      () => saveReview(bookId, { rating, text, spoiler }),
      () => {
        onOpenChange(false);
        toast(initial ? "Resenha atualizada." : "Resenha publicada.");
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={eyebrow}
      title={`O que você achou de ${title}?`}
      width={560}
    >
      <form onSubmit={submit}>
        <FormError message={error} />
        <div className="mb-4">
          <span className="block font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase mb-1.5">
            Sua nota
          </span>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <FormField
          label="Resenha"
          hint={`Opcional. Sem texto, fica só a nota. ${text.length}/5000`}
        >
          <TextArea
            value={text}
            maxLength={5000}
            className="min-h-40"
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
          <Button type="submit" variant="yellow" loading={pending}>
            {initial ? "Salvar resenha" : "Publicar"}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
