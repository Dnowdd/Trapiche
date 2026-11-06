import { loadBook, toCover } from "@/lib/books";
import { db } from "@/lib/db";
import { editionIds } from "@/lib/works";
import {
  C,
  clipText,
  coverImage,
  Cover,
  Eyebrow,
  fit,
  fmtNum,
  fmtRating,
  Grain,
  ogImage,
  OG_SIZE,
  Stars,
  Wordmark,
} from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Livro no Trapiche";

async function community(bookId: string) {
  const ids = await editionIds(bookId);
  const [rating, readers, quote] = await Promise.all([
    db.review.aggregate({
      where: { bookId: { in: ids }, hiddenAt: null },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    db.userBook.count({
      where: {
        bookId: { in: ids },
        status: { in: ["READ", "READING", "REREADING"] },
      },
    }),
    db.quote.findFirst({
      where: { bookId: { in: ids }, private: false, hiddenAt: null },
      orderBy: { createdAt: "desc" },
      select: { text: true },
    }),
  ]);
  return {
    average: rating._avg.rating ?? 0,
    count: rating._count.rating,
    readers,
    quote: quote && quote.text.length <= 220 ? quote.text : null,
  };
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await loadBook(id);
  if (!book) return ogImage(<Fallback />);
  const [cover, stats] = await Promise.all([
    coverImage(book.coverUrl, 380),
    community(id).catch(() => ({
      average: 0,
      count: 0,
      readers: 0,
      quote: null,
    })),
  ]);
  const author = book.authors.slice(0, 2).join(", ");
  const year = book.publishedDate?.slice(0, 4);
  const meta = [year, book.pageCount ? `${book.pageCount} páginas` : null]
    .filter(Boolean)
    .join(" · ");
  const rating =
    stats.count > 0
      ? {
          value: stats.average,
          label: `${fmtNum(stats.count)} ${stats.count === 1 ? "avaliação" : "avaliações"} no Trapiche`,
        }
      : book.googleRating
        ? { value: book.googleRating, label: "nota no Google Livros" }
        : null;
  const titleSize = fit(book.title, [
    [18, 76],
    [32, 64],
    [52, 54],
    [80, 46],
    [999, 40],
  ]);
  const palette = toCover(book).palette;

  return ogImage(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: C.dark,
        backgroundImage:
          "radial-gradient(ellipse 900px 700px at 18% 40%, rgba(255,231,103,0.26), rgba(255,231,103,0.06) 50%, rgba(43,39,16,0) 75%)",
        fontFamily: "Inter",
      }}
    >
      <Grain opacity={0.08} />
      <div
        style={{
          width: 470,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 70,
            width: 300,
            height: 26,
            borderRadius: 999,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
          }}
        />
        <Cover
          src={cover}
          title={book.title}
          author={book.authors[0]}
          width={300}
          palette={palette}
          style={{ transform: "rotate(-3deg)" }}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px 54px 10px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Eyebrow color={C.yellow} style={{ opacity: 0.85 }}>
            {meta ? `Livro · ${meta}` : "Livro"}
          </Eyebrow>
          <div
            style={{
              marginTop: 18,
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: titleSize,
              lineHeight: 1.04,
              letterSpacing: -1.5,
              color: C.cream,
              display: "flex",
            }}
          >
            {clipText(book.title, 90)}
          </div>
          {author && (
            <div
              style={{
                marginTop: 16,
                fontSize: 30,
                color: C.creamDeep,
                opacity: 0.85,
                display: "flex",
              }}
            >
              de {clipText(author, 60)}
            </div>
          )}
          {(rating || stats.readers > 0) && (
            <div
              style={{
                marginTop: 30,
                display: "flex",
                alignItems: "center",
                gap: 22,
              }}
            >
              {rating && (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      fontFamily: "Inter",
                      fontWeight: 800,
                      fontSize: 40,
                      color: C.yellow,
                      letterSpacing: -1,
                    }}
                  >
                    {fmtRating(rating.value)}
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    <Stars value={rating.value} size={22} />
                    <div
                      style={{ fontSize: 16, color: C.creamDeep, opacity: 0.7 }}
                    >
                      {rating.label}
                    </div>
                  </div>
                </div>
              )}
              {stats.readers > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 44,
                    padding: "0 18px",
                    borderRadius: 999,
                    border: "1.5px solid rgba(255,248,213,0.25)",
                    fontSize: 19,
                    color: C.cream,
                  }}
                >
                  {fmtNum(stats.readers)}{" "}
                  {stats.readers === 1 ? "leitor" : "leitores"}
                </div>
              )}
            </div>
          )}
          {stats.quote && (
            <div
              style={{
                marginTop: 30,
                display: "flex",
                borderLeft: `4px solid ${C.yellow}`,
                paddingLeft: 20,
                fontFamily: "Fraunces",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 23,
                lineHeight: 1.4,
                color: C.creamDeep,
              }}
            >
              “{clipText(stats.quote, 150)}”
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Wordmark size={30} />
          <div style={{ fontSize: 18, color: C.creamDeep, opacity: 0.6 }}>
            Resenhas, citações e listas de leitores
          </div>
        </div>
      </div>
    </div>,
  );
}

function Fallback() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.dark,
      }}
    >
      <Wordmark size={72} />
    </div>
  );
}
