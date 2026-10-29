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

function paceText(g: GoalData) {
  if (g.target == null || g.pace == null) return null;
  if (g.done >= g.target) return "Meta batida. Tudo que vier agora é bônus.";
  if (!g.current) return `Faltaram ${books(g.target - g.done)}.`;
  if (g.pace > 0) return `${books(g.pace)} à frente do ritmo.`;
  if (g.pace < 0) return `${books(-g.pace)} atrás do ritmo.`;
  return "No ritmo certinho.";
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
  const retro = (
    <Link
      href={`/u/${handle}/retrospectiva?ano=${goal.year}`}
      className="text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink)"
    >
      Retrospectiva {goal.year} →
    </Link>
  );

  return (
    <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-5 sm:p-6 sm:px-7 mb-5.5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-0.5">
            Meta de {goal.year}
          </div>
          <h3 className="m-0 text-[16px] font-bold tracking-[-0.005em] text-(--ink)">
            {goal.target != null ? (
              <>
                {goal.done} de {books(goal.target)}
              </>
            ) : (
              <>{books(goal.done)} lidos este ano</>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-4">
          {retro}
          {isOwner && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink) cursor-pointer"
            >
              {goal.target != null ? "Editar meta" : "Definir meta"}
            </button>
          )}
        </div>
      </div>
      {goal.target != null && (
        <>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={goal.target}
            aria-valuenow={goal.done}
            aria-label={`Meta de ${goal.year}`}
            className="h-2.5 bg-[rgba(67,62,18,0.08)] rounded-full overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-(--ink-2) transition-[width] duration-500"
              style={{ width: `${goal.pct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between gap-3 font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">
            <span>{paceText(goal)}</span>
            <span>{goal.pct}%</span>
          </div>
        </>
      )}
      {goal.target == null && isOwner && (
        <p className="m-0 text-[13px] text-(--ink-4)">
          Quantos livros você quer ler em {goal.year}? Defina uma meta e
          acompanhe o ritmo por aqui.
        </p>
      )}
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
