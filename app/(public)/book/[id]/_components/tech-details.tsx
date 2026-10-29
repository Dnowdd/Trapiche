import Link from "next/link";
import { publisherHref } from "@/lib/links";
import { fmtAgo } from "@/lib/dates";
import { fmtPublished } from "@/lib/books";
import { isOpenLibraryId } from "@/lib/open-library";
import type { BookPageData } from "@/lib/queries/book";
import { SectionHeader } from "./section-header";

export default function TechDetails({
  book,
  language,
}: {
  book: BookPageData["book"];
  language: string | null;
}) {
  const rows = [
    {
      label: "Editora",
      value: book.publisher,
      href: book.publisher ? publisherHref(book.publisher) : undefined,
    },
    { label: "Publicação", value: fmtPublished(book.publishedDate) },
    { label: "Páginas", value: book.pageCount?.toString() },
    { label: "Idioma", value: language },
    { label: "Dimensões", value: book.dimensions },
    { label: "ISBN-13", value: book.isbn13, mono: true },
    { label: "ISBN-10", value: book.isbn10, mono: true },
  ].filter((r) => r.value);

  if (rows.length === 0) return null;

  return (
    <section data-screen-label="Ficha técnica">
      <SectionHeader eyebrow="Ficha técnica" title="Esta edição" small />
      <dl className="m-0 bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[14px] px-5 py-1 grid sm:grid-cols-2 sm:gap-x-10">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex justify-between gap-4 py-2.5 border-b border-(--rule) last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
          >
            <dt className="text-[12px] text-(--ink-4) shrink-0">{r.label}</dt>
            <dd
              className={[
                "m-0 text-right text-(--ink-2) font-medium min-w-0 break-words",
                r.mono ? "font-mono text-[12px]" : "text-[13px]",
              ].join(" ")}
            >
              {"href" in r && r.href ? (
                <Link
                  href={r.href}
                  className="hover:underline underline-offset-2"
                >
                  {r.value}
                </Link>
              ) : (
                r.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      {isOpenLibraryId(book.id) ? (
        <div className="mt-2 text-[11px] text-(--ink-5)">
          Via{" "}
          <a
            href={`https://openlibrary.org/books/${book.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-(--ink-3)"
          >
            Open Library
          </a>{" "}
          · atualizado {fmtAgo(book.syncedAt)}
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-3 text-[11px] text-(--ink-5)">
          {/* eslint-disable-next-line @next/next/no-img-element -- Google's branding rules require the unaltered official badge. */}
          <img
            src="/powered-by-google.png"
            alt="Powered by Google"
            width={62}
            height={30}
            className="h-5 w-auto"
          />
          <a
            href={`https://books.google.com/books?id=${encodeURIComponent(book.id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-(--ink-3)"
          >
            Ver no Google Books
          </a>
        </div>
      )}
    </section>
  );
}
