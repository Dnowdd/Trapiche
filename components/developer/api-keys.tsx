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
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { createApiKey, revokeApiKey } from "@/lib/actions/developer";
import type { DeveloperData } from "@/lib/queries/developer";
import { MAX_ACTIVE_KEYS } from "@/lib/api/limits";
import CopyButton from "./copy-button";

function Revoke({ id, name }: { id: string; name: string }) {
  const { pending, run } = useAction();
  return (
    <Button
      variant="danger"
      className="h-8 px-3 text-[12px]"
      loading={pending}
      onClick={() => {
        if (
          !window.confirm(
            `Revogar a chave “${name}”? Quem estiver usando ela perde o acesso na hora.`,
          )
        )
          return;
        run(
          () => revokeApiKey(id),
          () => toast("Chave revogada."),
          toast,
        );
      }}
    >
      Revogar
    </Button>
  );
}

function CreateKey({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState<string | null>(null);
  const { pending, error, run } = useAction();
  const close = () => {
    setOpen(false);
    setKey(null);
    setName("");
  };
  return (
    <>
      <Button disabled={disabled} onClick={() => setOpen(true)}>
        + Nova chave
      </Button>
      {open && (
        <Modal
          open
          onOpenChange={(o) => !o && close()}
          eyebrow="API"
          title={key ? "Sua chave nova" : "Criar chave de API"}
          width={520}
        >
          {key ? (
            <>
              <div className="rounded-[10px] bg-(--yellow-soft) border border-(--yellow-deep) px-3.5 py-3 text-[13px] text-(--ink-2) leading-normal mb-4">
                Copie agora: <strong>ela não vai aparecer de novo</strong>. Se
                perder, é só revogar e criar outra.
              </div>
              <div className="flex gap-2 items-center">
                <code className="flex-1 min-w-0 truncate rounded-lg bg-(--ink-2) text-(--yellow) px-3 py-2.5 font-mono text-[12.5px]">
                  {key}
                </code>
                <CopyButton value={key} className="h-10" />
              </div>
              <FormActions>
                <Button onClick={close}>Pronto</Button>
              </FormActions>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () => createApiKey(name),
                  (data) => setKey(data!.key),
                );
              }}
            >
              <FormError message={error} />
              <FormField
                label="Nome"
                hint="Pra você lembrar onde ela é usada. Ex.: meu-site, script-de-backup."
              >
                <TextInput
                  value={name}
                  maxLength={60}
                  required
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                />
              </FormField>
              <FormActions>
                <Button type="button" variant="ghost" onClick={close}>
                  Cancelar
                </Button>
                <Button type="submit" loading={pending}>
                  Criar chave
                </Button>
              </FormActions>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}

export default function ApiKeys({ keys }: { keys: DeveloperData["keys"] }) {
  const active = keys.filter((k) => !k.revoked).length;
  return (
    <section className="rounded-[18px] border border-[rgba(67,62,18,0.1)] bg-(--cream-card) overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-(--rule)">
        <div>
          <h2 className="m-0 text-[16px] font-bold text-(--ink)">
            Chaves de API
          </h2>
          <div className="mt-0.5 font-mono text-[10.5px] text-(--ink-4)">
            {active} de {MAX_ACTIVE_KEYS} ativas
          </div>
        </div>
        <CreateKey disabled={active >= MAX_ACTIVE_KEYS} />
      </div>
      {keys.length === 0 ? (
        <p className="m-0 px-5 sm:px-6 py-6 text-[13px] text-(--ink-4)">
          Nenhuma chave ainda. Crie uma pra começar.
        </p>
      ) : (
        keys.map((k) => (
          <div
            key={k.id}
            className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 sm:px-6 py-3.5 border-b border-(--rule) last:border-b-0 ${k.revoked ? "opacity-55" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-(--ink) truncate">
                  {k.name}
                </span>
                {k.revoked && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.06em] bg-[rgba(67,62,18,0.08)] text-(--ink-4) px-1.5 py-px rounded">
                    revogada
                  </span>
                )}
              </div>
              <div className="font-mono text-[11px] text-(--ink-4)">
                {k.prefix}… · criada em {k.created} ·{" "}
                {k.lastUsed ? `usada ${k.lastUsed}` : "nunca usada"}
              </div>
            </div>
            {!k.revoked && <Revoke id={k.id} name={k.name} />}
          </div>
        ))
      )}
    </section>
  );
}
