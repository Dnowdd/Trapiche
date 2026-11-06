import type { Metadata } from "next";
import SupportShell from "@/components/support/shell";
import NewTicketForm from "@/components/support/new-ticket-form";
import { loadBook } from "@/lib/books";
import { appUrl } from "@/lib/emails/layout";
import { SUBJECT_MAX } from "@/lib/support";

export const metadata: Metadata = { title: "Novo ticket" };

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ livro?: string }>;
}) {
  const { livro } = await searchParams;
  const book = livro ? await loadBook(livro).catch(() => null) : null;
  const initial = book
    ? {
        category: "BOOK_DATA" as const,
        subject: `Dados errados: ${book.title}`.slice(0, SUBJECT_MAX),
        body: `Livro: ${book.title}${book.authors[0] ? `, de ${book.authors.join(", ")}` : ""}\n${appUrl(`/book/${book.id}`)}\n\nO que está errado (título, autor, capa, sinopse, páginas…) e como deveria ser:\n`,
      }
    : undefined;

  return (
    <SupportShell
      eyebrow="Suporte"
      title={book ? "Corrigir dados de um livro" : "Abrir um ticket"}
      back={{ href: "/suporte", label: "Meus tickets" }}
    >
      <div className="max-w-160">
        <NewTicketForm initial={initial} />
      </div>
    </SupportShell>
  );
}
