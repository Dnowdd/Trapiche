"use client";

import { useState } from "react";
import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import FinishModal from "@/components/reading/finish-modal";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { setShelfStatus } from "@/lib/actions/shelf";
import type { Dashboard } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";

type Book = Dashboard["picks"][number];

const STEPS = [
  { id: "books", label: "Coloque 3 livros na estante" },
  { id: "photo", label: "Escolha uma foto de perfil" },
  { id: "goal", label: "Defina sua meta do ano" },
  { id: "bio", label: "Conte o que você gosta de ler" },
] as const;

function Check({ done }: { done: boolean }) {
  return (
    <span
      className={cn(
        "w-5 h-5 shrink-0 rounded-full border-[1.5px] flex items-center justify-center",
        done
          ? "bg-(--ink-2) border-(--ink-2) text-(--yellow)"
          : "border-[rgba(67,62,18,0.3)]",
      )}
    >
      {done && (
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12l5 5L20 7" />
        </svg>
      )}
    </span>
  );
}

function Pick({
  book,
  today,
  onDone,
}: {
  book: Book;
  today: string;
  onDone: (id: string, label: string) => void;
}) {
  const id = book.googleId ?? book.id;
  const [finishing, setFinishing] = useState(false);
  const { pending, run } = useAction();
  const add = (status: "WANT" | "READING", label: string) =>
    run(
      () => setShelfStatus(id, status),
      () => onDone(book.id, label),
      toast,
    );
  const btn =
    "h-7 rounded-md text-[11px] font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-wait";

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <Link href={`/book/${id}`} className="block">
        <BookCover
          book={book}
          size="md"
          style={{ width: "100%", aspectRatio: "2/3" }}
        />
      </Link>
      <div className="text-[12px] font-semibold text-(--ink-2) leading-tight line-clamp-2 min-h-[2lh]">
        {book.title}
      </div>
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => setFinishing(true)}
          className={`${btn} col-span-2 bg-(--ink-2) text-(--yellow) hover:bg-(--ink)`}
        >
          Já li
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => add("READING", "lendo")}
          className={`${btn} border border-[rgba(67,62,18,0.2)] text-(--ink-2) hover:bg-(--yellow-soft)`}
        >
          Lendo
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => add("WANT", "na pilha")}
          className={`${btn} border border-[rgba(67,62,18,0.2)] text-(--ink-2) hover:bg-(--yellow-soft)`}
        >
          Quero
        </button>
      </div>
      {finishing && (
        <FinishModal
          open
          onOpenChange={setFinishing}
          bookId={id}
          title={book.title}
          today={today}
          onFinished={() => onDone(book.id, "lido")}
        />
      )}
    </div>
  );
}

export default function Onboarding({
  steps,
  picks,
  shelfCount,
  handle,
  today,
}: {
  steps: Dashboard["steps"];
  picks: Book[];
  shelfCount: number;
  handle: string;
  today: string;
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const visible = picks.filter((p) => !hidden.includes(p.id));
  const done = STEPS.filter((s) => steps[s.id]).length;
  const href: Record<(typeof STEPS)[number]["id"], string> = {
    books: "#sugestoes",
    photo: `/u/${handle}`,
    goal: `/u/${handle}?meta=1`,
    bio: `/u/${handle}?editar=1`,
  };

  return (
    <section className="rounded-[18px] border border-(--yellow-deep) bg-linear-135 from-(--yellow-soft) to-(--cream-card) to-60% p-5 sm:p-7">
      <div className="flex flex-col md:flex-row gap-6 md:gap-10">
        <div className="md:w-64 shrink-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
            Primeiros passos · {done}/{STEPS.length}
          </div>
          <h2 className="m-0 mt-1 text-[20px] font-extrabold tracking-[-0.02em] text-(--ink) leading-tight">
            Deixe o Trapiche com a sua cara
          </h2>
          <div className="mt-3 h-1.5 rounded-full bg-[rgba(67,62,18,0.1)] overflow-hidden">
            <div
              className="h-full rounded-full bg-(--ink-2) transition-[width] duration-500"
              style={{ width: `${(done / STEPS.length) * 100}%` }}
            />
          </div>
          <ul className="m-0 mt-4 p-0 list-none flex flex-col gap-1">
            {STEPS.map((s) => (
              <li key={s.id}>
                <Link
                  href={href[s.id]}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-1.5 -mx-2 text-[13px] hover:bg-[rgba(67,62,18,0.05)]",
                    steps[s.id]
                      ? "text-(--ink-4) line-through decoration-(--ink-5)"
                      : "text-(--ink-2) font-medium",
                  )}
                >
                  <Check done={steps[s.id]} />
                  {s.label}
                  {s.id === "books" && !steps.books && (
                    <span className="ml-auto font-mono text-[10px] text-(--ink-4) no-underline">
                      {shelfCount}/3
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {visible.length > 0 && (
          <div id="sugestoes" className="flex-1 min-w-0 scroll-mt-6">
            <div className="text-[13px] text-(--ink-3) mb-3">
              Comece por aqui — marque o que você já leu ou quer ler:
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {visible.slice(0, 6).map((b) => (
                <Pick
                  key={b.id}
                  book={b}
                  today={today}
                  onDone={(id, label) => {
                    setHidden((h) => [...h, id]);
                    toast(`“${b.title}” ${label}.`);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
