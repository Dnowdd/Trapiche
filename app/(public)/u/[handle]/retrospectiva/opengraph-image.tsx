import { db } from "@/lib/db";
import { privacySelect, profileAccess } from "@/lib/privacy";
import { getRetrospective } from "@/lib/queries/stats";
import {
  C,
  coverImage,
  Cover,
  Eyebrow,
  fmtNum,
  Grain,
  ogImage,
  OG_SIZE,
  Wordmark,
} from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Retrospectiva de leituras no Trapiche";

const fmtHours = (minutes: number) =>
  minutes >= 60 ? `${fmtNum(Math.round(minutes / 60))}h` : `${minutes}min`;

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const user = await db.user.findUnique({
    where: { handle },
    select: { id: true, name: true, handle: true, ...privacySelect },
  });
  const year = new Date().getUTCFullYear();
  const allowed = user && profileAccess(user, false, false).sections.diary;
  const data = allowed ? await getRetrospective(user.id, year) : null;
  const books = data?.books.slice(0, 12) ?? [];
  const n = books.length;
  const [perRow, coverWidth] =
    n <= 3
      ? [Math.max(1, n), 160]
      : n === 4
        ? [2, 140]
        : n <= 6
          ? [3, 130]
          : n <= 9
            ? [3, 110]
            : [4, 96];
  const covers = await Promise.all(
    books.map((b) => coverImage(b.coverUrl, 160)),
  );
  const first = user?.name.split(" ")[0] ?? "";
  const t = data?.totals;
  const stats = t
    ? [
        { value: fmtNum(t.books), label: t.books === 1 ? "livro" : "livros" },
        { value: fmtNum(t.pages), label: "páginas" },
        { value: fmtHours(t.minutes), label: "de leitura" },
      ]
    : [];

  return ogImage(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: C.dark,
        backgroundImage:
          "radial-gradient(ellipse 800px 600px at 100% 0%, rgba(255,231,103,0.18), rgba(43,39,16,0) 70%)",
        fontFamily: "Inter",
      }}
    >
      <Grain opacity={0.08} />
      <div
        style={{
          width: 640,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "62px 0 54px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Eyebrow color={C.yellow} style={{ opacity: 0.85 }}>
            Retrospectiva
          </Eyebrow>
          <div
            style={{
              marginTop: 10,
              fontFamily: "Fraunces",
              fontWeight: 800,
              fontSize: 132,
              lineHeight: 0.9,
              letterSpacing: -5,
              color: C.yellow,
              display: "flex",
            }}
          >
            {year}
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: 40,
              lineHeight: 1.1,
              color: C.cream,
              display: "flex",
            }}
          >
            {user ? `em livros, por ${first}` : "em livros"}
          </div>
        </div>
        {stats.length > 0 && (
          <div style={{ display: "flex", gap: 40 }}>
            {stats.map((s) => (
              <div
                key={s.label}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 54,
                    letterSpacing: -2,
                    color: C.cream,
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: "Mono",
                    fontSize: 15,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    color: C.creamDeep,
                    opacity: 0.7,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
        <Wordmark size={28} />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingRight: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 14,
            width: perRow * coverWidth + (perRow - 1) * 14,
            transform: "rotate(4deg)",
          }}
        >
          {books.map((b, i) => (
            <Cover
              key={`${b.id}-${i}`}
              src={covers[i]}
              title={b.title}
              author={b.author}
              width={coverWidth}
              palette={b.palette}
            />
          ))}
        </div>
      </div>
    </div>,
  );
}
