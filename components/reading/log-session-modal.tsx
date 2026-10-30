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
import { logReadingSession } from "@/lib/actions/shelf";
import { toast } from "@/components/shared/toast";
import { useAction } from "./use-action";
import PartialDateInput from "./partial-date-input";
import { PageCountField } from "./progress-modal";

export interface ReadingOption {
  id: string;
  title: string;
  currentPage: number;
  pageCount: number | null;
}

interface LogSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  books: ReadingOption[];
  today: string;
  onReachedEnd?: (bookId: string) => void;
}

export default function LogSessionModal({
  open,
  onOpenChange,
  books,
  today,
  onReachedEnd,
}: LogSessionModalProps) {
  const [bookId, setBookId] = useState(books[0]?.id ?? "");
  const book = books.find((b) => b.id === bookId) ?? books[0];
  const [date, setDate] = useState<string | null>(today);
  const [total, setTotal] = useState("");
  const [page, setPage] = useState("");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const { pending, error, run } = useAction();

  const pagesRead =
    book && page ? Math.max(0, Number(page) - book.currentPage) : 0;

  const dateInvalid = !date || date > today.slice(0, date.length);
  const max = book?.pageCount ?? (Number(total) || undefined);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || dateInvalid) return;
    run(
      () =>
        logReadingSession(book.id, {
          date: date!,
          pageEnd: page,
          minutes,
          note,
          pageCount: book.pageCount ? null : total,
        }),
      (data) => {
        onOpenChange(false);
        setPage("");
        setMinutes("");
        setNote("");
        toast("Leitura registrada no diário.");
        if (data?.reachedEnd) onReachedEnd?.(book.id);
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Diário"
      title="Registrar leitura"
      description={
        books.length
          ? "Anote até onde você chegou e quanto tempo leu. Não lembra o dia? Pode colocar só o mês ou o ano."
          : undefined
      }
    >
      {!books.length ? (
        <p className="m-0 text-[14px] text-(--ink-3) leading-[1.55]">
          Você não está lendo nenhum livro agora. Abra um livro e marque como
          “Lendo” para registrar sessões no diário.
        </p>
      ) : (
        <form onSubmit={submit}>
          <FormError message={error} />
          {books.length > 1 && (
            <FormField label="Livro">
              <select
                value={book?.id}
                onChange={(e) => setBookId(e.target.value)}
                className="w-full h-11 rounded-[10px] border-[1.5px] border-[rgba(67,62,18,0.14)] bg-(--cream-card) px-3 text-[14px] text-(--ink-2) outline-none focus:border-(--ink-3)"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </FormField>
          )}
          <PartialDateInput
            label="Quando"
            value={date}
            onChange={setDate}
            today={today}
          />
          {book && !book.pageCount && (
            <PageCountField value={total} onChange={setTotal} />
          )}
          <div className="grid grid-cols-2 gap-3.5">
            <FormField
              label="Parei na página"
              hint={
                book?.pageCount
                  ? `de ${book.pageCount}${pagesRead ? ` · +${pagesRead} pgs` : ""}`
                  : pagesRead
                    ? `+${pagesRead} pgs`
                    : undefined
              }
            >
              <TextInput
                type="number"
                inputMode="numeric"
                min={0}
                max={max}
                required
                value={page}
                placeholder={String(book?.currentPage ?? 0)}
                onChange={(e) => setPage(e.target.value)}
              />
            </FormField>
            <FormField label="Minutos">
              <TextInput
                type="number"
                inputMode="numeric"
                min={1}
                max={1440}
                required
                value={minutes}
                placeholder="30"
                onChange={(e) => setMinutes(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Nota" hint="Opcional. Aparece no seu diário.">
            <TextArea
              value={note}
              maxLength={500}
              placeholder="Um trecho, um lugar, um pensamento…"
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
            <Button
              type="submit"
              variant="yellow"
              loading={pending}
              disabled={dateInvalid}
            >
              Registrar
            </Button>
          </FormActions>
        </form>
      )}
    </Modal>
  );
}
