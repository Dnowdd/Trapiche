"use client";

import { useState } from "react";
import { BookUp } from "lucide-react";
import Modal from "@/components/shared/modal";
import {
  Button,
  FormActions,
  FormError,
  FormField,
  TextInput,
} from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import {
  deleteLoan,
  lendBook,
  returnLoan,
  updateLoan,
} from "@/lib/actions/loans";
import type { BookLoans, LoanItem } from "@/lib/queries/loans";
import { cn } from "@/lib/utils";

function LoanModal({
  bookId,
  title,
  loan,
  today,
  onClose,
}: {
  bookId: string;
  title: string;
  loan: LoanItem | null;
  today: string;
  onClose: () => void;
}) {
  const [person, setPerson] = useState(loan?.person ?? "");
  const [lentAt, setLentAt] = useState(loan?.lentAt ?? today);
  const [dueAt, setDueAt] = useState(loan?.dueAt ?? "");
  const [note, setNote] = useState(loan?.note ?? "");
  const { pending, error, run } = useAction();
  const removing = useAction();
  const input = { person, lentAt, dueAt: dueAt || null, note };

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      eyebrow={title}
      title={loan ? "Editar empréstimo" : "Emprestar este livro"}
      description="Só você vê. Se passar da data, a gente te lembra."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run<unknown>(
            () => (loan ? updateLoan(loan.id, input) : lendBook(bookId, input)),
            () => {
              onClose();
              toast(
                loan
                  ? "Empréstimo atualizado."
                  : `Anotado: está com ${person.trim()}.`,
              );
            },
          );
        }}
      >
        <FormError message={error || removing.error} />
        <FormField label="Com quem está">
          <TextInput
            value={person}
            required
            autoFocus
            maxLength={80}
            placeholder="Ana, minha irmã"
            onChange={(e) => setPerson(e.target.value)}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3.5">
          <FormField label="Emprestado em">
            <TextInput
              type="date"
              value={lentAt}
              max={today}
              required
              onChange={(e) => setLentAt(e.target.value)}
            />
          </FormField>
          <FormField label="Devolver até" hint="Opcional">
            <TextInput
              type="date"
              value={dueAt}
              min={lentAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Nota" hint="Opcional">
          <TextInput
            value={note}
            maxLength={300}
            placeholder="Emprestei no clube do livro"
            onChange={(e) => setNote(e.target.value)}
          />
        </FormField>
        <FormActions>
          {loan && (
            <Button
              type="button"
              variant="danger"
              className="mr-auto"
              loading={removing.pending}
              onClick={() =>
                removing.run(
                  () => deleteLoan(loan.id),
                  () => {
                    onClose();
                    toast("Empréstimo apagado.");
                  },
                )
              }
            >
              Apagar
            </Button>
          )}
          <Button type="submit" loading={pending}>
            Salvar
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}

export default function LoanControl({
  bookId,
  title,
  loans,
  today,
}: {
  bookId: string;
  title: string;
  loans: BookLoans;
  today: string;
}) {
  const [modal, setModal] = useState<null | "new" | "edit">(null);
  const returning = useAction();
  const open = loans.open;

  return (
    <div id="emprestimo" className="scroll-mt-6">
      {open ? (
        <div
          className={cn(
            "inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[12px] border px-3.5 py-2 text-[12.5px]",
            open.overdue
              ? "border-[rgba(154,74,42,0.35)] bg-[rgba(154,74,42,0.06)] text-(--danger)"
              : "border-[rgba(var(--ink-rgb),0.12)] bg-(--cream-card) text-(--ink-3)",
          )}
        >
          <BookUp size={14} aria-hidden />
          <span>
            Com <strong className="text-(--ink-2)">{open.person}</strong> desde{" "}
            {open.lent}
            {open.due ? ` · devolver até ${open.due}` : ""}
            {open.overdue ? " · atrasado" : ""}
          </span>
          <button
            type="button"
            disabled={returning.pending}
            onClick={() =>
              returning.run(
                () => returnLoan(open.id),
                () => toast("Que bom, o livro voltou pra casa."),
                toast,
              )
            }
            className="font-semibold text-(--ink-2) border-b border-(--ink-4) cursor-pointer hover:text-(--ink) disabled:cursor-wait"
          >
            Devolvido
          </button>
          <button
            type="button"
            onClick={() => setModal("edit")}
            className="text-(--ink-3) border-b border-(--ink-4) cursor-pointer hover:text-(--ink)"
          >
            Editar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setModal("new")}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border border-dashed border-[rgba(var(--ink-rgb),0.3)] text-[12px] text-(--ink-3) hover:bg-(--yellow-soft) hover:text-(--ink-2) cursor-pointer"
        >
          <BookUp size={13} aria-hidden />
          Emprestei
          {loans.history.length > 0 && (
            <span className="font-mono text-[10px] text-(--ink-5)">
              · {loans.history.length}× antes
            </span>
          )}
        </button>
      )}
      {modal && (
        <LoanModal
          bookId={bookId}
          title={title}
          loan={modal === "edit" ? open : null}
          today={today}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
