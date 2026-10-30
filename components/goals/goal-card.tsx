"use client";

import { useState } from "react";
import Link from "next/link";
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
import { setReadingGoal } from "@/lib/actions/goals";
import type { GoalData } from "@/lib/queries/stats";

const books = (n: number) => `${n} ${n === 1 ? "livro" : "livros"}`;

function pace(
  g: GoalData,
): { text: string; tone: "good" | "bad" | "neutral" } | null {
  if (g.target == null || g.pace == null) return null;
  if (g.done >= g.target)
    return { text: "Meta batida! Agora é tudo bônus.", tone: "good" };
  if (!g.current)
    return { text: `Faltaram ${books(g.target - g.done)}.`, tone: "neutral" };
  if (g.pace > 0)
    return { text: `${books(g.pace)} à frente do ritmo`, tone: "good" };
  if (g.pace < 0)
    return { text: `${books(-g.pace)} atrás do ritmo`, tone: "bad" };
  return { text: "No ritmo certinho", tone: "neutral" };
}

const TONE = {
  good: "bg-[#e3eccb] text-[#3d5a1c]",
  bad: "bg-[#f6dccb] text-[#8a3f1f]",
  neutral: "bg-[rgba(67,62,18,0.07)] text-(--ink-3)",
};

function Ring({ pct }: { pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        strokeWidth="9"
        className="stroke-[rgba(67,62,18,0.09)]"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(100, pct) / 100)}
        className="stroke-(--ink-2) transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}

export default function GoalCard({
  goal,
  isOwner,
  handle,
}: {
  goal: GoalData;
  isOwner: boolean;
  handle: string;
}) {
  const [open, setOpen] = useState(false);
  const p = pace(goal);

  return (
    <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
          Meta de {goal.year}
        </div>
        {isOwner && goal.target != null && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink) cursor-pointer"
          >
            Editar
          </button>
        )}
      </div>

      {goal.target != null ? (
        <div className="flex items-center gap-5">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={goal.target}
            aria-valuenow={goal.done}
            aria-label={`Meta de ${goal.year}`}
            className="relative w-24 h-24 shrink-0"
          >
            <Ring pct={goal.pct} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] font-extrabold tracking-[-0.03em] text-(--ink) leading-none tabular-nums">
                {goal.pct}%
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[30px] font-extrabold tracking-[-0.03em] text-(--ink) leading-none tabular-nums">
              {goal.done}
              <span className="text-[16px] font-semibold text-(--ink-4) tracking-[-0.01em]">
                {" "}
                / {goal.target}
              </span>
            </div>
            <div className="mt-1 text-[12px] text-(--ink-4)">
              {goal.target === 1 ? "livro" : "livros"} lidos
            </div>
            {p && (
              <span
                className={`mt-2.5 inline-block text-[11px] font-semibold py-1 px-2.5 rounded-full ${TONE[p.tone]}`}
              >
                {p.text}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="text-[30px] font-extrabold tracking-[-0.03em] text-(--ink) leading-none tabular-nums">
            {goal.done}
          </div>
          <div className="mt-1 text-[12px] text-(--ink-4)">
            {goal.done === 1 ? "livro lido" : "livros lidos"} em {goal.year}
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 w-full h-10 rounded-[10px] border border-dashed border-[rgba(67,62,18,0.3)] text-[13px] font-medium text-(--ink-2) cursor-pointer hover:bg-(--yellow-soft) hover:border-solid"
            >
              Definir uma meta para {goal.year}
            </button>
          )}
        </div>
      )}

      <Link
        href={`/u/${handle}/retrospectiva?ano=${goal.year}`}
        className="mt-5 pt-4 border-t border-(--rule) flex items-center justify-between text-[12px] font-medium text-(--ink-3) hover:text-(--ink)"
      >
        Retrospectiva de {goal.year}
        <span aria-hidden>→</span>
      </Link>
      {open && <GoalModal goal={goal} onOpenChange={setOpen} />}
    </div>
  );
}

function GoalModal({
  goal,
  onOpenChange,
}: {
  goal: GoalData;
  onOpenChange: (open: boolean) => void;
}) {
  const [value, setValue] = useState(goal.target ? String(goal.target) : "");
  const { pending, error, setError, run } = useAction();
  const remove = useAction();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) {
      setError("Digite um número de livros.");
      return;
    }
    run(
      () => setReadingGoal(goal.year, n),
      () => {
        onOpenChange(false);
        toast("Meta salva.");
      },
    );
  };

  return (
    <Modal
      open
      onOpenChange={onOpenChange}
      eyebrow={`Meta de ${goal.year}`}
      title="Quantos livros você quer ler?"
      description={`Contam as leituras terminadas em ${goal.year}, releituras incluídas.`}
      width={420}
    >
      <form onSubmit={submit}>
        <FormError message={error} />
        <FormField label="Livros">
          <TextInput
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </FormField>
        <FormActions>
          {goal.target != null && (
            <Button
              type="button"
              variant="danger"
              className="mr-auto"
              loading={remove.pending}
              onClick={() =>
                remove.run(
                  () => setReadingGoal(goal.year, null),
                  () => {
                    onOpenChange(false);
                    toast("Meta removida.");
                  },
                  toast,
                )
              }
            >
              Remover
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="yellow" loading={pending}>
            Salvar
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
