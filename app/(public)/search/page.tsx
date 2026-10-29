import type { Metadata } from "next";
import Link from "next/link";
import { toCover, volumeToRow } from "@/lib/books";
import { bestCover } from "@/lib/cover-probe";
import { smartSearch } from "@/lib/google-books";
import { authorHref } from "@/lib/links";
import { initialsOf } from "@/lib/queries/book";
import type { GoogleBooksVolume } from "@/lib/types/book";
import WorksGrid, { GoogleWorks } from "../_components/works-grid";

interface Props {
  searchParams: Promise<{ q?: string; lang?: string }>;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Busca: ${q}` : "Busca" };
}

async function toWork(v: GoogleBooksVolume, editions: number) {
  const row = volumeToRow(v);
  return {
    cover: toCover({ ...row, coverUrl: await bestCover(row.coverUrl) }),
    year: row.publishedDate?.slice(0, 4) ?? null,
    editions,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", lang } = await searchParams;
  const query = q.trim();
  const onlyPt = lang === "pt";
  const result = query.length >= 2 ? await smartSearch(query, 40) : null;

  const works = result
    ? await Promise.all(
        result.works
          .filter(
            ({ main }) => !onlyPt || main.volumeInfo.language?.startsWith("pt"),
          )
          .map(({ main, editions }) => toWork(main, editions.length)),
      )
    : [];
  const google = result
    ? await Promise.all(result.google.map((v) => toWork(v, 1)))
    : [];
  const toggleHref = `/search?${new URLSearchParams({
    q: query,
    ...(onlyPt ? {} : { lang: "pt" }),
  })}`;

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="pt-7 md:pt-10 px-4 sm:px-8 lg:px-18.75 pb-12 md:pb-15">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase">
          Busca
        </div>
        <h1 className="m-0 mt-2 text-[28px] md:text-[36px] font-extrabold tracking-[-0.025em] leading-[1.05] text-(--ink)">
          {query ? `“${query}”` : "O que você quer ler?"}
        </h1>

        {result && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-(--ink-3)">
            <span>
              {works.length} {works.length === 1 ? "obra" : "obras"}
            </span>
            <Link
              href={toggleHref}
              className={[
                "h-8 px-3 rounded-full border inline-flex items-center text-[12px] font-medium",
                onlyPt
                  ? "bg-(--ink-2) text-(--yellow) border-(--ink-2)"
                  : "border-[rgba(67,62,18,0.18)] text-(--ink-2) hover:bg-(--yellow-soft)",
              ].join(" ")}
            >
              Só em português
            </Link>
          </div>
        )}

        {result && result.authors.length > 0 && (
          <section className="mt-8">
            <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-3">
              Autores
            </div>
            <div className="flex flex-wrap gap-3">
              {result.authors.map((a) => (
                <Link
                  key={a.name}
                  href={authorHref(a.name)}
                  className="flex items-center gap-3 bg-(--cream-card) border border-[rgba(67,62,18,0.08)] rounded-[12px] py-2.5 pl-2.5 pr-4 hover:bg-(--yellow-soft)"
                >
                  <span className="w-9 h-9 rounded-full bg-(--yellow) border border-(--ink-2) flex items-center justify-center text-[12px] font-bold text-(--ink-2)">
                    {initialsOf(a.name)}
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-(--ink)">
                      {a.name}
                    </span>
                    <span className="block text-[12px] text-(--ink-4)">
                      {a.works} obras
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {works.length > 0 && (
          <section className="mt-10">
            <WorksGrid works={works} showAuthor />
          </section>
        )}

        {result && works.length === 0 && google.length === 0 && (
          <p className="mt-10 text-[14px] text-(--ink-3)">
            Nada encontrado. Tente outro termo, o nome do autor ou o ISBN.
          </p>
        )}

        <GoogleWorks works={google} showAuthor />
      </div>
    </div>
  );
}
