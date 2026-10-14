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

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  title: string;
  initial?: { rating: number; text: string } | null;
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
  return (
    <div
      className="flex gap-1 text-[30px] leading-none"
      role="radiogroup"
      aria-label="Nota"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className={`cursor-pointer transition-[color,transform] duration-100 hover:scale-110 ${n <= shown ? "text-(--ink-2)" : "text-[rgba(67,62,18,0.18)]"}`}
        >
          ★
        </button>
      ))}
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
  const { pending, error, setError, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError("Escolha de 1 a 5 estrelas.");
      return;
    }
    run(
      () => saveReview(bookId, { rating, text }),
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
            placeholder="Conte o que ficou com você, sem spoilers…"
            onChange={(e) => setText(e.target.value)}
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
          <Button type="submit" variant="yellow" loading={pending}>
            {initial ? "Salvar resenha" : "Publicar"}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
