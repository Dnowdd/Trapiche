import { fmtAgo } from "@/lib/dates";
import { fmtPublished } from "@/lib/books";
import type { BookPageData } from "@/lib/queries/book";

export default function TechDetails({
  book,
  language,
}: {
  book: BookPageData["book"];
  language: string | null;
}) {
  const rows = [
    { label: "Título", value: book.title },
    { label: "Autor(es)", value: book.authors.join(", ") },
    { label: "Editora", value: book.publisher },
    { label: "Publicação", value: fmtPublished(book.publishedDate) },
    { label: "Idioma desta edição", value: language },
    { label: "Páginas", value: book.pageCount?.toString() },
    { label: "Dimensões", value: book.dimensions },
    { label: "ISBN-10", value: book.isbn10, mono: true },
    { label: "ISBN-13", value: book.isbn13, mono: true },
  ].filter((r) => r.value);

  return (
    <section className="mt-14" data-screen-label="10 Detalhes">
      <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
        Ficha técnica
      </div>
      <h2 className="m-0 mb-1.5 text-[24px] font-bold tracking-[-0.015em] text-(--ink)">
        Detalhes desta edição
      </h2>
      <div className="h-5.5" />
      <div className="bg-(--cream) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-7 px-8 grid grid-cols-3 gap-y-5.5 gap-x-9">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
              {r.label}
            </div>
            <div
              className={
                r.mono
                  ? "font-mono text-[13px] text-(--ink-2) font-medium"
                  : "text-[14px] text-(--ink-2) font-medium"
              }
            >
              {r.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3.5 font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">
        Dados sincronizados via Google Books · última atualização{" "}
        {fmtAgo(book.syncedAt)}
      </div>
    </section>
  );
}
