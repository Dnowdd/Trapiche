"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trophy, X } from "lucide-react";
import Modal from "@/components/shared/modal";
import BookCover from "@/components/shared/book-cover";
import {
  Button,
  FormActions,
  FormError,
  FormField,
  TextInput,
} from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { createChallenge, deleteChallenge } from "@/lib/actions/challenges";
import {
  FORMATS,
  LANGUAGES,
  LONG_PAGES,
  SHORT_PAGES,
  type ChallengeKindId,
} from "@/lib/challenges";
import type { ChallengeItem } from "@/lib/queries/challenges";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<ChallengeKindId, string> = {
  ANY: "Qualquer livro",
  TAG: "Livros com uma tag",
  AUTHOR: "Livros de um autor",
  LANGUAGE: "Livros em um idioma",
  FORMAT: "Livros em um formato",
  LONG: `Livros longos (${LONG_PAGES}+ páginas)`,
  SHORT: `Livros curtos (até ${SHORT_PAGES} páginas)`,
};

const PRESETS: {
  title: string;
  kind: ChallengeKindId;
  value?: string;
  target: number;
}[] = [
  { title: "Encarar os calhamaços", kind: "LONG", target: 3 },
  { title: "Ler mais em português", kind: "LANGUAGE", value: "pt", target: 12 },
  { title: "Ouvir audiolivros", kind: "FORMAT", value: "AUDIO", target: 4 },
  { title: "Leituras de uma tarde", kind: "SHORT", target: 6 },
];

const control =
  "h-11 w-full rounded-[10px] border-[1.5px] border-[rgba(var(--ink-rgb),0.14)] bg-(--cream-card) px-3 text-[14px] text-(--ink-2) outline-none focus:border-(--ink-3) cursor-pointer";

function NewChallenge({
  tags,
  onClose,
}: {
  tags: { id: string; name: string }[];
  onClose: () => void;
}) {
  const year = new Date().getFullYear();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ChallengeKindId>("ANY");
  const [value, setValue] = useState("");
  const [target, setTarget] = useState("5");
  const [startsAt, setStartsAt] = useState(`${year}-01-01`);
  const [endsAt, setEndsAt] = useState(`${year}-12-31`);
  const { pending, error, run } = useAction();

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setTitle(p.title);
    setKind(p.kind);
    setValue(p.value ?? "");
    setTarget(String(p.target));
  };

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      eyebrow="Desafios"
      title="Novo desafio"
      description="O progresso conta sozinho a partir dos livros que você terminar no período."
      width={540}
    >
      <div className="flex flex-wrap gap-2 mb-5">
        {PRESETS.map((p) => (
          <button
            key={p.title}
            type="button"
            onClick={() => applyPreset(p)}
            className="h-8 px-3 rounded-full border border-[rgba(var(--ink-rgb),0.18)] text-[12px] text-(--ink-2) hover:bg-(--yellow-soft) cursor-pointer"
          >
            {p.title}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () =>
              createChallenge({ title, kind, value, target, startsAt, endsAt }),
            () => {
              onClose();
              toast("Desafio criado. Boa sorte!");
            },
          );
        }}
      >
        <FormError message={error} />
        <FormField label="Nome">
          <TextInput
            value={title}
            required
            maxLength={80}
            placeholder="Ler toda a obra da Clarice"
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>
        <div className="grid sm:grid-cols-[1fr_110px] gap-3.5">
          <FormField label="O que conta">
            <select
              className={control}
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as ChallengeKindId);
                setValue("");
              }}
            >
              {(Object.keys(KIND_LABEL) as ChallengeKindId[]).map((k) => (
                <option
                  key={k}
                  value={k}
                  disabled={k === "TAG" && !tags.length}
                >
                  {KIND_LABEL[k]}
                  {k === "TAG" && !tags.length ? " (crie uma tag antes)" : ""}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Meta">
            <TextInput
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </FormField>
        </div>
        {kind === "TAG" && (
          <FormField label="Tag">
            <select
              className={control}
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
            >
              <option value="">Escolha uma tag</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FormField>
        )}
        {kind === "AUTHOR" && (
          <FormField label="Autor">
            <TextInput
              value={value}
              required
              maxLength={120}
              placeholder="Clarice Lispector"
              onChange={(e) => setValue(e.target.value)}
            />
          </FormField>
        )}
        {(kind === "LANGUAGE" || kind === "FORMAT") && (
          <FormField label={kind === "LANGUAGE" ? "Idioma" : "Formato"}>
            <select
              className={control}
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
            >
              <option value="">Escolha</option>
              {Object.entries(kind === "LANGUAGE" ? LANGUAGES : FORMATS).map(
                ([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </FormField>
        )}
        <div className="grid grid-cols-2 gap-3.5">
          <FormField label="De">
            <TextInput
              type="date"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </FormField>
          <FormField label="Até">
            <TextInput
              type="date"
              required
              min={startsAt}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </FormField>
        </div>
        <FormActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            Criar desafio
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}

function ChallengeRow({ c, isOwner }: { c: ChallengeItem; isOwner: boolean }) {
  const removing = useAction();
  return (
    <li className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-(--ink-2) leading-snug flex items-center gap-1.5">
            {c.complete && (
              <Trophy
                size={14}
                className="text-(--ink-2) shrink-0"
                aria-label="Concluído"
              />
            )}
            <span className="truncate">{c.title}</span>
          </div>
          <div className="text-[11.5px] text-(--ink-4)">
            {c.target} {c.target === 1 ? "livro" : "livros"} {c.detail} · até{" "}
            {c.until}
            {c.ended && !c.complete ? " · encerrado" : ""}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="font-mono text-[12px] font-semibold text-(--ink-2) tabular-nums">
            {c.done}/{c.target}
          </span>
          {isOwner && (
            <button
              type="button"
              aria-label={`Apagar o desafio ${c.title}`}
              disabled={removing.pending}
              onClick={() => {
                if (!window.confirm(`Apagar o desafio “${c.title}”?`)) return;
                removing.run(
                  () => deleteChallenge(c.id),
                  () => toast("Desafio apagado."),
                  toast,
                );
              }}
              className="size-6 rounded-md flex items-center justify-center text-(--ink-4) hover:text-(--danger) hover:bg-[rgba(var(--ink-rgb),0.06)] cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-[rgba(var(--ink-rgb),0.08)] overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            c.complete ? "bg-[#5e8a2e]" : "bg-(--ink-2)",
          )}
          style={{ width: `${c.percent}%` }}
        />
      </div>
      {c.books.length > 0 && (
        <div className="mt-2 flex gap-1.5">
          {c.books.map((b) => (
            <Link key={b.id} href={`/book/${b.id}`} title={b.title}>
              <BookCover book={b} size="sm" style={{ width: 22, height: 33 }} />
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}

export default function ChallengesCard({
  items,
  isOwner,
  tags = [],
}: {
  items: ChallengeItem[];
  isOwner: boolean;
  tags?: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  if (!isOwner && !items.length) return null;

  return (
    <section className="rounded-[18px] border border-[rgba(var(--ink-rgb),0.08)] bg-(--cream-card) p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
            Desafios
          </div>
          <h2 className="m-0 mt-0.5 text-[16px] font-bold text-(--ink)">
            {isOwner ? "Seus desafios" : "Desafios de leitura"}
          </h2>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-semibold text-(--ink-2) hover:bg-(--yellow-soft) cursor-pointer"
          >
            <Plus size={14} aria-hidden /> Novo
          </button>
        )}
      </div>
      {items.length ? (
        <ul className="m-0 p-0 list-none divide-y divide-(--rule)">
          {items.map((c) => (
            <ChallengeRow key={c.id} c={c} isOwner={isOwner} />
          ))}
        </ul>
      ) : (
        <p className="m-0 text-[13px] text-(--ink-4) leading-normal">
          Além da meta do ano: “3 calhamaços”, “toda a obra da Clarice”, “6
          audiolivros”. O progresso conta sozinho.
        </p>
      )}
      {open && <NewChallenge tags={tags} onClose={() => setOpen(false)} />}
    </section>
  );
}
