import { getSeriesPage } from "@/lib/queries/series";
import {
  C,
  clipText,
  coverImage,
  Cover,
  Eyebrow,
  fit,
  Grain,
  ogImage,
  OG_SIZE,
  Wordmark,
} from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Série de livros no Trapiche";

const fmtPos = (n: number) => n.toLocaleString("pt-BR");

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = await getSeriesPage(slug, null);
  const items = series?.items.slice(0, 7) ?? [];
  const covers = await Promise.all(
    items.map((i) => coverImage(i.book.coverUrl, 220)),
  );
  const name = series?.name ?? "Série";
  const authors = [...new Set(items.map((i) => i.book.author))].slice(0, 2);
  const width = items.length <= 3 ? 170 : items.length <= 5 ? 140 : 112;

  return ogImage(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: C.dark,
        backgroundImage:
          "radial-gradient(ellipse 900px 520px at 50% 115%, rgba(255,231,103,0.22), rgba(43,39,16,0) 70%)",
        fontFamily: "Inter",
        padding: "56px 72px 48px",
      }}
    >
      <Grain opacity={0.08} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Eyebrow color={C.yellow} style={{ opacity: 0.85 }}>
            {`Série · ${series?.total ?? 0} livros · em ordem`}
          </Eyebrow>
          <div
            style={{
              marginTop: 14,
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: fit(name, [
                [18, 66],
                [32, 54],
                [999, 44],
              ]),
              lineHeight: 1.04,
              letterSpacing: -1.6,
              color: C.cream,
              display: "flex",
            }}
          >
            {clipText(name, 60)}
          </div>
          {authors.length > 0 && (
            <div
              style={{
                marginTop: 10,
                fontSize: 26,
                color: C.creamDeep,
                opacity: 0.8,
                display: "flex",
              }}
            >
              de {authors.join(", ")}
            </div>
          )}
        </div>
        <Wordmark size={26} />
      </div>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 22,
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.workId}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Cover
              src={covers[i]}
              title={item.book.title}
              author={item.book.author}
              width={width}
              palette={item.book.palette}
            />
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                background: C.yellow,
                color: C.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              {fmtPos(item.position)}
            </div>
          </div>
        ))}
      </div>
    </div>,
  );
}
