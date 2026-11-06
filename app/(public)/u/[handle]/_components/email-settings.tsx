"use client";

import { useState } from "react";
import { Button, FormActions, FormError } from "@/components/shared/form";
import Switch from "@/components/shared/switch";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { updateEmailPreferences } from "@/lib/actions/profile";

export default function EmailSettings({
  initial,
  onDone,
}: {
  initial: { inactivityReminder: boolean; monthlyDigest: boolean };
  onDone: () => void;
}) {
  const [value, setValue] = useState(initial);
  const { pending, error, run } = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () => updateEmailPreferences(value),
      () => {
        onDone();
        toast("Preferências de e-mail salvas.");
      },
    );
  };

  return (
    <form onSubmit={submit}>
      <FormError message={error} />
      <p className="m-0 mb-2 text-[13px] text-(--ink-3) leading-normal">
        E-mails de conta e segurança (confirmação, senha, suporte) sempre
        chegam. Estes aqui são opcionais e você pode desligar quando quiser,
        aqui ou pelo link no próprio e-mail.
      </p>
      <div className="divide-y divide-(--rule)">
        <Switch
          label="Resumo do mês"
          description="No começo de cada mês: livros terminados, páginas, horas e um link para a sua retrospectiva."
          checked={value.monthlyDigest}
          onChange={(v) => setValue((p) => ({ ...p, monthlyDigest: v }))}
        />
        <Switch
          label="Lembrete de leitura"
          description="Um toque gentil quando você passa 10 dias sem registrar leitura de um livro que está lendo. No máximo um a cada duas semanas."
          checked={value.inactivityReminder}
          onChange={(v) => setValue((p) => ({ ...p, inactivityReminder: v }))}
        />
      </div>
      <FormActions>
        <Button type="submit" loading={pending}>
          Salvar
        </Button>
      </FormActions>
    </form>
  );
}
