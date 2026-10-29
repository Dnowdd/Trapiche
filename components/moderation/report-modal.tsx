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
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { reportContent } from "@/lib/actions/reports";
import { REPORT_REASONS, type ReportReason } from "@/lib/report-reasons";

export default function ReportModal({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: { reviewId: string } | { commentId: string };
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const { pending, error, setError, run } = useAction();
  const isReview = "reviewId" in target;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Escolha um motivo.");
      return;
    }
    run(
      () => reportContent({ ...target, reason, details }),
      () => {
        onOpenChange(false);
        toast("Denúncia enviada. Obrigado por avisar.");
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Denunciar"
      title={
        isReview
          ? "O que há de errado com esta resenha?"
          : "O que há de errado com este comentário?"
      }
      description="A moderação analisa cada denúncia. Quem escreveu não fica sabendo quem denunciou."
    >
      <form onSubmit={submit}>
        <FormError message={error} />
        <div role="radiogroup" className="flex flex-col gap-2 mb-4">
          {(Object.keys(REPORT_REASONS) as ReportReason[]).map((key) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded-[12px] border border-[rgba(67,62,18,0.12)] px-4 py-3 text-[14px] text-(--ink-2) cursor-pointer has-checked:border-(--ink-2) has-checked:bg-(--cream-card)"
            >
              <input
                type="radio"
                name="reason"
                value={key}
                checked={reason === key}
                onChange={() => setReason(key)}
                className="size-4 accent-(--ink-2)"
              />
              {REPORT_REASONS[key]}
            </label>
          ))}
        </div>
        <FormField label="Detalhes" hint="Opcional.">
          <TextArea
            value={details}
            maxLength={500}
            className="min-h-20"
            onChange={(e) => setDetails(e.target.value)}
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
          <Button type="submit" variant="danger" loading={pending}>
            Enviar denúncia
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
