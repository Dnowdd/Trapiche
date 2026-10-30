"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  FormActions,
  FormError,
  FormField,
  TextArea,
  TextInput,
} from "@/components/shared/form";
import { useAction } from "@/components/reading/use-action";
import { openTicket } from "@/lib/actions/support";
import {
  MESSAGE_MAX,
  SUBJECT_MAX,
  TICKET_CATEGORIES,
  type TicketCategoryId,
} from "@/lib/support";
import { cn } from "@/lib/utils";

export default function NewTicketForm() {
  const router = useRouter();
  const [category, setCategory] = useState<TicketCategoryId>("BUG");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const { pending, error, run } = useAction();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => openTicket({ subject, category, body }),
          (data) => router.replace(`/suporte/${data!.id}`),
        );
      }}
    >
      <FormError message={error} />
      <fieldset className="mb-5">
        <legend className="block font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase mb-2">
          Sobre o quê?
        </legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TICKET_CATEGORIES) as TicketCategoryId[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
              className={cn(
                "h-9 px-3.5 rounded-full border text-[13px] font-medium cursor-pointer transition-colors duration-120",
                category === id
                  ? "bg-(--ink-2) text-(--yellow) border-(--ink-2)"
                  : "border-[rgba(67,62,18,0.15)] text-(--ink-3) hover:bg-(--yellow-soft)",
              )}
            >
              {TICKET_CATEGORIES[id]}
            </button>
          ))}
        </div>
      </fieldset>
      <FormField label="Assunto">
        <TextInput
          value={subject}
          maxLength={SUBJECT_MAX}
          required
          minLength={4}
          placeholder="Ex.: Não consigo marcar um livro como lido"
          onChange={(e) => setSubject(e.target.value)}
        />
      </FormField>
      <FormField
        label="Mensagem"
        hint={`Conte o que aconteceu e, se puder, onde. ${body.length}/${MESSAGE_MAX}`}
      >
        <TextArea
          value={body}
          maxLength={MESSAGE_MAX}
          required
          className="min-h-40"
          onChange={(e) => setBody(e.target.value)}
        />
      </FormField>
      <FormActions>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending}>
          Abrir ticket
        </Button>
      </FormActions>
    </form>
  );
}
