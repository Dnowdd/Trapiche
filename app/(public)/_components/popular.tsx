import Link from "next/link";
import BookCover from "@/components/shared/book-cover";
import { getHomePopular } from "@/lib/queries/home";

const Popular = async () => {
  const items = await getHomePopular(8);
  if (items.length === 0) return null;

  return (
    <section
      id="populares"
      className="px-4 sm:px-8 lg:px-20 scroll-mt-6"
      data-screen-label="06 Populares"
    >
      <div className="pb-4">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
          Nas estantes
        </div>
        <h2 className="m-0 text-[22px] font-bold text-(--ink-2) tracking-[-0.01em]">
          Livros populares no Trapiche
        </h2>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-4 gap-y-6">
        {items.map(({ book, readers }) => (
          <Link
            href={`/book/${book.googleId ?? book.id}`}
            className="flex flex-col gap-2 transition-transform duration-120 hover:-translate-y-0.5"
            key={book.id}
          >
            <BookCover
              book={book}
              size="md"
              style={{ width: "100%", aspectRatio: "2/3" }}
            />
            <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight line-clamp-2">
              {book.title}
            </div>
            <div className="text-[11px] text-(--ink-4) -mt-1">
              {readers > 0
                ? `${readers.toLocaleString("pt-BR")} ${readers === 1 ? "leitor" : "leitores"}`
                : book.author}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Popular;
