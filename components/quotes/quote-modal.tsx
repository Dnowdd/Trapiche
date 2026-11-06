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
import Switch from "@/components/shared/switch";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { addQuote, updateQuote } from "@/lib/actions/quotes";
import { QUOTE_MAX, QUOTE_NOTE_MAX } from "@/lib/quotes";

export interface QuoteDraft {
  id?: string;
  text: string;
  page: number | null;
  note: string | null;
  private: boolean;
}

export default function QuoteModal({
  open,
  onOpenChange,
  bookId,
  bookTitle,
  initial,
  currentPage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookId: string;
  bookTitle: string;
  initial?: QuoteDraft;
  currentPage?: number | null;
}) {
  const [text, setText] = useState(initial?.text ?? "");
  const [page, setPage] = useState(
    initial?.page != null
      ? String(initial.page)
      : currentPage
        ? String(currentPage)
        : "",
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [isPrivate, setPrivate] = useState(initial?.private ?? false);
  const { pending, error, run } = useAction();
  const editing = Boolean(initial?.id);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = { text, page, note, private: isPrivate };
    run<unknown>(
      () =>
        editing ? updateQuote(initial!.id!, input) : addQuote(bookId, input),
      () => {
        onOpenChange(false);
        toast(editing ? "Citação atualizada." : "Citação guardada.");
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={bookTitle}
      title={editing ? "Editar citação" : "Guardar uma citação"}
      description="Aquele trecho que você sublinharia. Copie do jeito que está no livro."
      width={560}
    >
      <form onSubmit={submit}>
        <FormError message={error} />
        <FormField label="Trecho" hint={`${text.length}/${QUOTE_MAX}`}>
          <TextArea
            value={text}
            required
            autoFocus
            maxLength={QUOTE_MAX}
            placeholder="“Viver é muito perigoso.”"
            className="min-h-36 font-serif text-[16px] italic"
            onChange={(e) => setText(e.target.value)}
          />
        </FormField>
        <div className="grid grid-cols-[120px_1fr] gap-3.5">
          <FormField label="Página" hint="Opcional">
            <TextInput
              inputMode="numeric"
              value={page}
              placeholder="—"
              onChange={(e) => setPage(e.target.value.replace(/\D/g, ""))}
            />
          </FormField>
          <FormField
            label="Sua nota"
            hint={`Opcional · ${note.length}/${QUOTE_NOTE_MAX}`}
          >
            <TextInput
              value={note}
              maxLength={QUOTE_NOTE_MAX}
              placeholder="Por que esse trecho ficou com você?"
              onChange={(e) => setNote(e.target.value)}
            />
          </FormField>
        </div>
        <div className="border-t border-(--rule)">
          <Switch
            label="Só para mim"
            description="Citações privadas não aparecem na página do livro nem no seu perfil."
            checked={isPrivate}
            onChange={setPrivate}
          />
        </div>
        <FormActions>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            {editing ? "Salvar" : "Guardar citação"}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
