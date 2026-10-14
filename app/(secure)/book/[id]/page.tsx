import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVolume } from "@/lib/google-books";
import BookActions from "./_components/book-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookDetailPage({ params }: Props) {
  const { id } = await params;

  let volume;
  try {
    volume = await getVolume(id);
  } catch {
    notFound();
  }

  const info = volume.volumeInfo;
  const cover =
    info.imageLinks?.large ??
    info.imageLinks?.medium ??
    info.imageLinks?.small ??
    info.imageLinks?.thumbnail;
  const coverUrl = cover?.replace("http:", "https:") ?? null;

  const isbn13 = info.industryIdentifiers?.find(
    (x) => x.type === "ISBN_13",
  )?.identifier;
  const isbn10 = info.industryIdentifiers?.find(
    (x) => x.type === "ISBN_10",
  )?.identifier;

  const descParagraphs = info.description
    ? info.description.split(/\n+/).filter(Boolean)
    : [];

  return (
    <div className="bg-(--cream) rounded-[30px] border-15 border-(--yellow) mx-3.75 overflow-hidden">
      <div className="pt-12.5 px-18.75 pb-15">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-(--ink-4) tracking-[0.04em] mb-7 uppercase">
          <Link href="/" className="text-(--ink-4) transition-colors duration-120 hover:text-(--ink-2)">
            Trapiche
          </Link>
          <span className="text-(--ink-5)">/</span>
          <span className="text-(--ink-4)">Livros</span>
          {info.authors?.[0] && (
            <>
              <span className="text-(--ink-5)">/</span>
              <span className="text-(--ink-4)">{info.authors[0]}</span>
            </>
          )}
          <span className="text-(--ink-5)">/</span>
          <span className="text-(--ink-2) truncate max-w-52">{info.title}</span>
        </div>

        {/* Hero */}
        <section className="grid grid-cols-[320px_1fr] gap-15 items-start mb-15">

          {/* Cover */}
          <div className="relative">
            {coverUrl ? (
              <div
                className="rounded-[6px] overflow-hidden"
                style={{
                  width: 320,
                  height: 480,
                  boxShadow:
                    "0 30px 50px -28px rgba(67,62,18,0.55), 0 8px 16px -8px rgba(67,62,18,0.25)",
                }}
              >
                <Image
                  src={coverUrl}
                  alt={`Capa de ${info.title}`}
                  width={320}
                  height={480}
                  className="object-cover w-full h-full"
                  loading="eager"
                />
              </div>
            ) : (
              <div
                className="rounded-[6px] bg-(--cream-card) flex items-center justify-center border border-[rgba(67,62,18,0.08)]"
                style={{
                  width: 320,
                  height: 480,
                  boxShadow:
                    "0 30px 50px -28px rgba(67,62,18,0.55), 0 8px 16px -8px rgba(67,62,18,0.25)",
                }}
              >
                <span className="text-[64px] opacity-20">📚</span>
              </div>
            )}
            {info.publisher && (
              <div className="mt-2.5 font-mono text-[10px] text-(--ink-4) tracking-[0.04em] text-center uppercase">
                {info.publisher}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase flex gap-2.5 items-center flex-wrap">
              {info.categories?.[0] && <span>{info.categories[0]}</span>}
              {info.categories?.[0] && info.publishedDate && (
                <span className="text-(--ink-5)">·</span>
              )}
              {info.publishedDate && (
                <span>{info.publishedDate.slice(0, 4)}</span>
              )}
              {info.publisher && (
                <>
                  <span className="text-(--ink-5)">·</span>
                  <span>{info.publisher}</span>
                </>
              )}
            </div>

            <h1 className="mt-3 mb-1 text-[52px] font-extrabold tracking-[-0.025em] leading-[1.02] text-(--ink) text-balance max-w-[700px]">
              {info.title}
            </h1>

            {info.subtitle && (
              <p className="text-[18px] text-(--ink-3) mb-2 leading-snug">
                {info.subtitle}
              </p>
            )}

            <div className="text-[18px] text-(--ink-3) mb-4">
              por{" "}
              <span className="text-(--ink-2) border-b border-(--ink-4) pb-px">
                {info.authors?.join(", ") ?? "Autor desconhecido"}
              </span>
            </div>

            {/* Google rating */}
            {info.averageRating != null && (
              <div className="flex items-center gap-5.5 mt-1 mb-5.5">
                <div className="text-[44px] font-extrabold text-(--ink) tracking-[-0.025em] leading-[1] flex items-baseline gap-1">
                  {info.averageRating.toFixed(1)}
                  <span className="text-[14px] font-medium text-(--ink-4) tracking-normal font-mono">
                    / 5
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[18px] text-(--ink-2) tracking-[-1px]">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={
                          i < Math.round(info.averageRating!)
                            ? ""
                            : "text-[rgba(67,62,18,0.18)]"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {info.ratingsCount != null && (
                    <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.04em]">
                      {info.ratingsCount.toLocaleString("pt-BR")} avaliações no
                      Google Books
                    </div>
                  )}
                </div>
              </div>
            )}

            <BookActions />

            {/* Meta strip */}
            <div className="grid grid-cols-4 gap-6 py-5.5 border-y border-(--rule) mt-5">
              {info.pageCount && (
                <div>
                  <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
                    Páginas
                  </div>
                  <div className="text-[14px] text-(--ink-2) font-medium">
                    {info.pageCount}
                  </div>
                </div>
              )}
              <div>
                <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
                  Idioma
                </div>
                <div className="text-[14px] text-(--ink-2) font-medium capitalize">
                  {info.language === "pt"
                    ? "Português"
                    : info.language === "en"
                      ? "Inglês"
                      : info.language ?? "—"}
                </div>
              </div>
              {info.publisher && (
                <div>
                  <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
                    Editora
                  </div>
                  <div className="text-[14px] text-(--ink-2) font-medium">
                    {info.publisher}
                  </div>
                </div>
              )}
              {isbn13 && (
                <div>
                  <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
                    ISBN-13
                  </div>
                  <div className="font-mono text-[13px] text-(--ink-2) font-medium">
                    {isbn13}
                  </div>
                </div>
              )}
            </div>

            {/* Categories */}
            {info.categories && info.categories.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-4">
                {info.categories.map((c) => (
                  <span
                    key={c}
                    className="font-mono text-[10px] bg-(--yellow-soft) text-(--ink-2) border border-(--yellow-deep) py-1 px-[9px] rounded tracking-[0.04em] uppercase"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* About */}
        {descParagraphs.length > 0 && (
          <section className="mb-12 max-w-[780px]">
            <h2 className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-4">
              Sobre o livro
            </h2>
            <div className="flex flex-col gap-3.5">
              {descParagraphs.map((p, i) => (
                <p
                  key={i}
                  className="text-[15px] leading-[1.65] text-(--ink-3)"
                  dangerouslySetInnerHTML={{ __html: p }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Tech details */}
        {(isbn13 ?? isbn10) && (
          <section className="mb-12">
            <h2 className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-4">
              Ficha técnica
            </h2>
            <div className="bg-(--cream-card) rounded-[14px] border border-[rgba(67,62,18,0.07)] p-6 grid grid-cols-3 gap-x-8 gap-y-4 max-w-[780px]">
              {[
                { label: "Título", value: info.title },
                { label: "Autor(es)", value: info.authors?.join(", ") },
                { label: "Editora", value: info.publisher },
                { label: "Publicação", value: info.publishedDate },
                { label: "Páginas", value: info.pageCount?.toString() },
                { label: "Idioma", value: info.language === "pt" ? "Português" : info.language === "en" ? "Inglês" : info.language },
                { label: "ISBN-13", value: isbn13 },
                { label: "ISBN-10", value: isbn10 },
              ]
                .filter((r) => r.value)
                .map((row) => (
                  <div key={row.label}>
                    <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-0.5">
                      {row.label}
                    </div>
                    <div className="text-[13px] text-(--ink-2) font-medium">
                      {row.value}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* User sections placeholder */}
        <div className="border border-dashed border-[rgba(67,62,18,0.12)] rounded-[14px] py-8 px-8 text-center max-w-[780px]">
          <p className="text-[13px] text-(--ink-4) font-mono tracking-[0.04em]">
            Histórico de leitura, resenhas e listas disponíveis em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
