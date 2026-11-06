"use client";

import { useState } from "react";
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
import { releaseBookCuration, updateBookData } from "@/lib/actions/books";
import type { BookPageData } from "@/lib/queries/book";

export default function BookEditor({ book }: { book: BookPageData["book"] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: book.title,
    subtitle: book.subtitle ?? "",
    authors: book.authors.join(", "),
    publisher: book.publisher ?? "",
    publishedDate: book.publishedDate ?? "",
    pageCount: book.pageCount ? String(book.pageCount) : "",
    language: book.language ?? "",
    description: book.description ?? "",
    coverUrl: book.coverUrl ?? "",
  });
  const { pending, error, run } = useAction();
  const releasing = useAction();
  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[12px] font-semibold text-(--ink-2) border-b border-(--ink-4) pb-px cursor-pointer hover:text-(--ink)"
      >
        Corrigir dados (admin)
      </button>
      {book.curatedAt && (
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-(--ink-4)">
          Editado pela equipe
        </span>
      )}
      {open && (
        <Modal
          open
          onOpenChange={setOpen}
          eyebrow="Moderação"
          title="Corrigir dados do livro"
          description="Depois de salvar, o Trapiche para de atualizar esta edição pelo Open Library."
          width={620}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () => updateBookData(book.id, form),
                () => {
                  setOpen(false);
                  toast("Dados do livro atualizados.");
                },
              );
            }}
          >
            <FormError message={error || releasing.error} />
            <FormField label="Título">
              <TextInput value={form.title} required onChange={set("title")} />
            </FormField>
            <FormField label="Subtítulo" hint="Opcional">
              <TextInput value={form.subtitle} onChange={set("subtitle")} />
            </FormField>
            <FormField label="Autores" hint="Separe por vírgula.">
              <TextInput
                value={form.authors}
                required
                onChange={set("authors")}
              />
            </FormField>
            <div className="grid sm:grid-cols-3 gap-x-3">
              <FormField label="Editora">
                <TextInput value={form.publisher} onChange={set("publisher")} />
              </FormField>
              <FormField label="Ano ou data">
                <TextInput
                  value={form.publishedDate}
                  placeholder="2024"
                  onChange={set("publishedDate")}
                />
              </FormField>
              <FormField label="Páginas">
                <TextInput
                  value={form.pageCount}
                  inputMode="numeric"
                  onChange={set("pageCount")}
                />
              </FormField>
            </div>
            <div className="grid sm:grid-cols-[120px_1fr] gap-x-3">
              <FormField label="Idioma" hint="pt, en, es…">
                <TextInput value={form.language} onChange={set("language")} />
              </FormField>
              <FormField
                label="Capa"
                hint="URL de capa do Open Library (covers.openlibrary.org)."
              >
                <TextInput value={form.coverUrl} onChange={set("coverUrl")} />
              </FormField>
            </div>
            <FormField label="Sinopse">
              <TextArea
                value={form.description}
                className="min-h-40"
                onChange={set("description")}
              />
            </FormField>
            <FormActions>
              {book.curatedAt && (
                <Button
                  type="button"
                  variant="ghost"
                  className="mr-auto"
                  loading={releasing.pending}
                  onClick={() =>
                    releasing.run(
                      () => releaseBookCuration(book.id),
                      () => {
                        setOpen(false);
                        toast("Voltou a sincronizar com o Open Library.");
                      },
                    )
                  }
                >
                  Voltar a sincronizar
                </Button>
              )}
              <Button type="submit" loading={pending}>
                Salvar correção
              </Button>
            </FormActions>
          </form>
        </Modal>
      )}
    </div>
  );
}
