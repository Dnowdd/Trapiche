import catalog from "@/lib/data/books.json";
import {
  C,
  coverImage,
  Cover,
  Eyebrow,
  Grain,
  ogImage,
  OG_SIZE,
  Wordmark,
} from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Trapiche, o porto seguro das suas leituras";

type CatalogEntry = {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  palette: { bg: string; fg: string };
};

const PICKS = [
  "Memórias póstumas",
  "Grande Sertão",
  "A hora da estrela",
  "Capitães da Areia",
  "Vidas secas",
];

function picks() {
  const books = (catalog.books as unknown as CatalogEntry[]).filter(
    (b) => b.coverUrl,
  );
  const chosen = PICKS.map((t) =>
    books.find((b) => b.title.toLowerCase().startsWith(t.toLowerCase())),
  ).filter((b): b is CatalogEntry => Boolean(b));
  for (const b of books) {
    if (chosen.length >= 5) break;
    if (!chosen.includes(b)) chosen.push(b);
  }
  return chosen.slice(0, 5);
}

const FAN = [
  { x: 0, y: 92, r: -11, w: 150 },
  { x: 92, y: 44, r: -5, w: 170 },
  { x: 200, y: 10, r: 0, w: 196 },
  { x: 330, y: 44, r: 5, w: 170 },
  { x: 440, y: 92, r: 11, w: 150 },
];

export default async function Image() {
  const books = picks();
  const covers = await Promise.all(
    books.map((b) => coverImage(b.coverUrl, 300)),
  );
  const order = [0, 4, 1, 3, 2];

  return ogImage(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: C.yellow,
        backgroundImage:
          "radial-gradient(ellipse 700px 500px at 85% 110%, rgba(67,62,18,0.22), rgba(255,231,103,0) 70%)",
        fontFamily: "Inter",
        overflow: "hidden",
      }}
    >
      <Grain opacity={0.05} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 0 58px 72px",
          width: 590,
        }}
      >
        <Wordmark size={34} color={C.ink} accent={C.ink} letter={C.yellow} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Eyebrow color={C.ink3}>Diário de leituras</Eyebrow>
          <div
            style={{
              marginTop: 18,
              fontFamily: "Fraunces",
              fontWeight: 800,
              fontSize: 70,
              lineHeight: 1,
              letterSpacing: -2.5,
              color: C.ink,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            O porto seguro das suas leituras.
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 25,
              lineHeight: 1.4,
              color: C.ink2,
              display: "flex",
            }}
          >
            Estante, diário, citações, resenhas e listas. Em português.
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 600,
          top: 140,
          width: 600,
          height: 520,
          display: "flex",
        }}
      >
        {order.map((i) => {
          const b = books[i];
          const f = FAN[i];
          if (!b) return null;
          return (
            <div
              key={b.id}
              style={{
                position: "absolute",
                left: f.x,
                top: f.y,
                display: "flex",
              }}
            >
              <Cover
                src={covers[i]}
                title={b.title}
                author={b.author}
                width={f.w}
                palette={b.palette}
                style={{ transform: `rotate(${f.r}deg)` }}
              />
            </div>
          );
        })}
      </div>
    </div>,
  );
}
