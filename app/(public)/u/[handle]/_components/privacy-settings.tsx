"use client";

import { useState } from "react";
import { Button, FormActions, FormError } from "@/components/shared/form";
import Switch from "@/components/shared/switch";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { updatePrivacy, type PrivacyInput } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    id: "PUBLIC",
    title: "Público",
    body: "Qualquer pessoa vê seu perfil, mesmo sem conta.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
  },
  {
    id: "MEMBERS",
    title: "Só quem tem conta",
    body: "Visitantes sem login veem só seu nome e sua foto.",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 20a6.5 6.5 0 0 0-3-5.5" />
      </>
    ),
  },
  {
    id: "PRIVATE",
    title: "Só eu",
    body: "Ninguém além de você vê sua estante, seu diário ou suas atividades.",
    icon: (
      <>
        <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
        <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      </>
    ),
  },
] as const;

const SECTIONS = [
  {
    key: "showShelf",
    label: "Estante",
    description: "Seus livros por status, o que você está lendo e a pilha.",
  },
  {
    key: "showDiary",
    label: "Diário e retrospectiva",
    description: "Sessões de leitura, heatmap, estatísticas do ano.",
  },
  {
    key: "showActivity",
    label: "Atividade recente",
    description: "O histórico do que você começou, terminou e avaliou.",
  },
  {
    key: "showGoal",
    label: "Meta de leitura",
    description: "Sua meta anual e o progresso até ela.",
  },
  {
    key: "showLikes",
    label: "Curtidas",
    description: "Os livros que você curtiu.",
  },
  {
    key: "showCity",
    label: "Cidade",
    description: "A cidade que aparece abaixo do seu nome.",
  },
] as const;

export default function PrivacySettings({
  initial,
  handle,
  onDone,
}: {
  initial: PrivacyInput;
  handle: string;
  onDone: () => void;
}) {
  const [value, setValue] = useState<PrivacyInput>(initial);
  const { pending, error, run } = useAction();
  const set = <K extends keyof PrivacyInput>(k: K, v: PrivacyInput[K]) =>
    setValue((prev) => ({ ...prev, [k]: v }));
  const closed = value.profileVisibility === "PRIVATE";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () => updatePrivacy(value),
      () => {
        onDone();
        toast("Privacidade atualizada.");
      },
    );
  };

  return (
    <form onSubmit={submit}>
      <FormError message={error} />
      <div className="font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase mb-2.5">
        Quem pode ver seu perfil
      </div>
      <div role="radiogroup" className="grid gap-2">
        {OPTIONS.map((o) => {
          const active = value.profileVisibility === o.id;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={active}
              key={o.id}
              onClick={() => set("profileVisibility", o.id)}
              className={cn(
                "flex items-start gap-3.5 text-left rounded-[14px] border-[1.5px] px-4 py-3.5 cursor-pointer transition-colors duration-150",
                active
                  ? "border-(--ink-2) bg-(--yellow-soft)"
                  : "border-[rgba(67,62,18,0.12)] hover:bg-[rgba(67,62,18,0.03)]",
              )}
            >
              <span
                className={cn(
                  "size-9 shrink-0 rounded-full flex items-center justify-center",
                  active
                    ? "bg-(--ink-2) text-(--yellow)"
                    : "bg-[rgba(67,62,18,0.07)] text-(--ink-3)",
                )}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {o.icon}
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-(--ink)">
                  {o.title}
                </span>
                <span className="block mt-0.5 text-[12.5px] text-(--ink-4) leading-normal">
                  {o.body}
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "mt-1 size-4.5 shrink-0 rounded-full border-2 flex items-center justify-center",
                  active ? "border-(--ink-2)" : "border-[rgba(67,62,18,0.25)]",
                )}
              >
                {active && (
                  <span className="size-2 rounded-full bg-(--ink-2)" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase">
        O que aparece para os outros
      </div>
      <p className="m-0 mt-1 text-[12.5px] text-(--ink-4)">
        {closed
          ? "Com o perfil fechado, nada disso aparece para ninguém."
          : "Escolha o que fica visível para quem pode ver seu perfil."}
      </p>
      <div className="mt-1 divide-y divide-(--rule)">
        {SECTIONS.map((s) => (
          <Switch
            key={s.key}
            label={s.label}
            description={s.description}
            checked={value[s.key]}
            disabled={closed}
            onChange={(v) => set(s.key, v)}
          />
        ))}
      </div>

      <div className="mt-6 font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase">
        Buscadores
      </div>
      <div className="divide-y divide-(--rule)">
        <Switch
          label="Aparecer no Google e em outros buscadores"
          description="Só vale para perfis públicos. Desligado, pedimos aos buscadores que não indexem seu perfil."
          checked={value.searchIndexing && value.profileVisibility === "PUBLIC"}
          disabled={value.profileVisibility !== "PUBLIC"}
          onChange={(v) => set("searchIndexing", v)}
        />
      </div>

      <div className="mt-5 rounded-[12px] bg-[rgba(67,62,18,0.05)] px-4 py-3 text-[12.5px] leading-normal text-(--ink-3)">
        Resenhas, comentários e listas públicas continuam visíveis onde foram
        publicados. Para esconder uma lista, mude a visibilidade dela.
      </div>

      <FormActions>
        <a
          href={`/u/${handle}?visitante=1`}
          className="mr-auto self-center text-[12.5px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink)"
        >
          Ver como visitante
        </a>
        <Button type="submit" loading={pending}>
          Salvar privacidade
        </Button>
      </FormActions>
    </form>
  );
}
