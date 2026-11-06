import { getPublicQuote } from "@/lib/queries/quotes";
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
export const alt = "Citação de livro no Trapiche";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getPublicQuote(id);
  if (!quote)
    return ogImage(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: C.cream,
        }}
      >
        <Wordmark size={72} color={C.ink} accent={C.ink} letter={C.yellow} />
      </div>,
    );
  const cover = await coverImage(quote.book.coverUrl, 200);
  const text = clipText(quote.text, 300);
  const textSize = fit(text, [
    [40, 66],
    [90, 54],
    [160, 44],
    [230, 37],
    [999, 32],
  ]);

  return ogImage(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: C.cream,
        fontFamily: "Inter",
        padding: "56px 80px 50px",
      }}
    >
      <Grain opacity={0.04} />
      <div
        style={{
          position: "absolute",
          top: -40,
          left: 34,
          fontFamily: "Fraunces",
          fontWeight: 800,
          fontSize: 340,
          lineHeight: 1,
          color: C.yellow,
          display: "flex",
        }}
      >
        “
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 22,
          background: C.yellow,
          display: "flex",
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          paddingTop: 40,
        }}
      >
        <div
          style={{
            fontFamily: "Fraunces",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: textSize,
            lineHeight: 1.32,
            letterSpacing: -0.5,
            color: C.ink,
            display: "flex",
          }}
        >
          {text}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `2px solid ${C.creamDeep}`,
          paddingTop: 26,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Cover
            src={cover}
            title={quote.book.title}
            author={quote.book.author}
            width={66}
            palette={quote.book.palette}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Fraunces",
                fontWeight: 600,
                fontSize: 30,
                color: C.ink,
                display: "flex",
              }}
            >
              {clipText(quote.book.title, 46)}
            </div>
            <Eyebrow color={C.ink4} style={{ fontSize: 16, marginTop: 6 }}>
              {[quote.book.author, quote.page ? `p. ${quote.page}` : null]
                .filter(Boolean)
                .join(" · ")}
            </Eyebrow>
          </div>
        </div>
        <Wordmark color={C.ink} accent={C.ink} letter={C.yellow} size={26} />
      </div>
    </div>,
  );
}
