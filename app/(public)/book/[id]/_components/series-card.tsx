"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BookCover from "@/components/shared/book-cover";
import Modal from "@/components/shared/modal";
import {
  Button,
  FormActions,
  FormError,
  FormField,
  TextArea,
  TextInput,
} from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import { removeBookFromSeries, setBookSeries } from "@/lib/actions/series";
import type { BookSeries } from "@/lib/queries/series";
import { cn } from "@/lib/utils";

const fmtPos = (n: number) => n.toLocaleString("pt-BR");

function SeriesEditor({
  open,
  onOpenChange,
  series,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  series: BookSeries;
}) {
  const { id: bookId } = useParams<{ id: string }>();
  const router = useRouter();
  const filled = series.empty ? null : series;
  const [name, setName] = useState(filled?.name ?? "");
  const [position, setPosition] = useState(
    filled?.current ? String(filled.current.position) : "",
  );
  const [description, setDescription] = useState(filled?.description ?? "");
  const { pending, error, run } = useAction();
  const removing = useAction();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Moderação"
      title={filled ? "Editar série" : "Adicionar a uma série"}
      description="Vale para todas as edições desta obra. Se a série já existir com esse nome, o livro entra nela."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () => setBookSeries(bookId, { name, position, description }),
            () => {
              onOpenChange(false);
              toast("Série salva.");
              router.refresh();
            },
          );
        }}
      >
        <FormError message={error || removing.error} />
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <FormField label="Nome da série">
            <TextInput
              value={name}
              required
              maxLength={120}
              placeholder="Ex.: Trilogia da Fundação"
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField label="Posição">
            <TextInput
              value={position}
              required
              inputMode="decimal"
              placeholder="1"
              onChange={(e) => setPosition(e.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Descrição da série" hint="Opcional">
          <TextArea
            value={description}
            maxLength={1000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <FormActions>
          {filled && (
            <Button
              type="button"
              variant="danger"
              className="mr-auto"
              loading={removing.pending}
              onClick={() =>
                removing.run(
                  () => removeBookFromSeries(bookId),
                  () => {
                    onOpenChange(false);
                    toast("Livro removido da série.");
                  },
                )
              }
            >
              Tirar da série
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

export default function SeriesCard({ series }: { series: BookSeries }) {
  const [editing, setEditing] = useState(false);

  if (series.empty)
    return (
      <div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full h-10 rounded-[12px] border border-dashed border-[rgba(var(--ink-rgb),0.25)] text-[12.5px] text-(--ink-3) hover:bg-(--yellow-soft) cursor-pointer"
        >
          + Adicionar a uma série
        </button>
        {editing && (
          <SeriesEditor open onOpenChange={setEditing} series={series} />
        )}
      </div>
    );

  const progress = series.total ? (series.read / series.total) * 100 : 0;

  return (
    <section className="rounded-[18px] bg-(--ink-2) text-(--cream) p-5 overflow-hidden relative">
      <div
        aria-hidden
        className="absolute -right-8 -top-10 size-36 rounded-full bg-(--yellow) opacity-[0.08]"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--yellow)">
            {series.current
              ? series.current.position <= series.total &&
                Number.isInteger(series.current.position)
                ? `Livro ${fmtPos(series.current.position)} de ${series.total}`
                : `Livro ${fmtPos(series.current.position)} da série`
              : `Série · ${series.total} ${series.total === 1 ? "livro" : "livros"}`}
          </div>
          <Link
            href={`/serie/${series.slug}`}
            className="mt-1 block text-[17px] font-bold tracking-[-0.01em] leading-tight hover:underline"
          >
            {series.name}
          </Link>
        </div>
        {series.canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 h-7 px-2.5 rounded-lg text-[11px] text-(--cream-deep) hover:bg-[rgba(255,248,213,0.1)] cursor-pointer"
          >
            Editar
          </button>
        )}
      </div>

      <div className="relative mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {series.items.map((item) => (
          <Link
            key={item.workId}
            href={`/book/${item.book.id}`}
            title={`${fmtPos(item.position)}. ${item.book.title}`}
            className={cn(
              "relative shrink-0 rounded-[4px] transition-transform duration-150 hover:-translate-y-1",
              item.current &&
                "ring-2 ring-(--yellow) ring-offset-2 ring-offset-(--ink-2)",
              !item.current && item.status !== "READ" && "opacity-70",
            )}
          >
            <BookCover
              book={item.book}
              size="sm"
              style={{ width: 44, height: 66 }}
            />
            <span className="absolute -top-1.5 -left-1.5 min-w-5 h-5 px-1 rounded-full bg-(--cream) text-(--ink) text-[10px] font-bold flex items-center justify-center tabular-nums">
              {fmtPos(item.position)}
            </span>
            {item.status === "READ" && (
              <span className="absolute -bottom-1 -right-1 size-4.5 rounded-full bg-(--yellow) text-(--ink) flex items-center justify-center">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4 12l5 5L20 6" />
                </svg>
              </span>
            )}
          </Link>
        ))}
      </div>

      {series.read > 0 && (
        <div className="relative mt-4">
          <div className="flex items-baseline justify-between text-[12px]">
            <span className="text-(--cream-deep)">
              Você leu {series.read} de {series.total}
            </span>
            <span className="font-mono text-[10px] text-(--yellow)">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-[rgba(255,248,213,0.14)] overflow-hidden">
            <div
              className="h-full rounded-full bg-(--yellow)"
              style={{ width: `${progress}%` }}
            />
          </div>
          {series.next && !series.next.current && (
            <Link
              href={`/book/${series.next.book.id}`}
              className="mt-3 flex items-center gap-2 text-[12.5px] text-(--cream) hover:underline"
            >
              Próximo:{" "}
              <strong className="truncate">{series.next.book.title}</strong> →
            </Link>
          )}
        </div>
      )}

      {editing && (
        <SeriesEditor open onOpenChange={setEditing} series={series} />
      )}
    </section>
  );
}
