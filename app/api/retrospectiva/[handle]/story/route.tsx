import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { MONTHS_LONG, today } from "@/lib/dates";
import { privacySelect, profileAccess } from "@/lib/privacy";
import { getRetrospective } from "@/lib/queries/stats";
import { getViewerId } from "@/lib/session";
import {
  C,
  clipText,
  coverImage,
  Cover,
  fmtNum,
  Grain,
  ogImage,
  Wordmark,
} from "@/lib/og";

const SIZE = { width: 1080, height: 1920 };

function period(params: URLSearchParams) {
  const now = today();
  const year = Number(params.get("ano")) || now.getUTCFullYear();
  const rawMonth = params.get("mes");
  const month = rawMonth ? Number(rawMonth) : undefined;
  if (!Number.isInteger(year) || year < 1900 || year > now.getUTCFullYear())
    return null;
  if (
    month !== undefined &&
    (!Number.isInteger(month) || month < 1 || month > 12)
  )
    return null;
  return { year, month };
}

const hours = (m: number) =>
  m >= 60 ? `${fmtNum(Math.round(m / 60))}h` : `${m}min`;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const p = period(req.nextUrl.searchParams);
  const user = await db.user.findUnique({
    where: { handle },
    select: { id: true, name: true, handle: true, ...privacySelect },
  });
  const viewerId = await getViewerId();
  if (
    !user ||
    !p ||
    !profileAccess(user, viewerId === user.id, viewerId != null).sections.diary
  )
    return new Response("Not found", { status: 404 });

  const data = await getRetrospective(user.id, p.year, p.month);
  const books = data.books.slice(0, 5);
  const covers = await Promise.all(
    books.map((b) => coverImage(b.coverUrl, 300)),
  );
  const t = data.totals;
  const label = p.month
    ? `${MONTHS_LONG[p.month - 1].toLowerCase()} de ${p.year}`
    : String(p.year);
  const first = user.name.split(" ")[0];
  const stats = [
    {
      value: fmtNum(t.books),
      label: t.books === 1 ? "livro lido" : "livros lidos",
    },
    { value: fmtNum(t.pages), label: "páginas" },
    { value: hours(t.minutes), label: "de leitura" },
    {
      value: fmtNum(t.readingDays),
      label: t.readingDays === 1 ? "dia lendo" : "dias lendo",
    },
  ];
  const n = books.length;
  const mid = (n - 1) / 2;
  const author = data.authors[0]?.name;

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
          "radial-gradient(ellipse 1100px 900px at 50% 58%, rgba(255,231,103,0.20), rgba(43,39,16,0) 70%)",
        fontFamily: "Inter",
        padding: "110px 90px 100px",
      }}
    >
      <Grain opacity={0.08} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Wordmark size={44} />
        <div
          style={{
            fontFamily: "Mono",
            fontSize: 26,
            color: C.creamDeep,
            opacity: 0.8,
            display: "flex",
          }}
        >
          {`@${user.handle}`}
        </div>
      </div>

      <div style={{ marginTop: 90, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontFamily: "Mono",
            fontSize: 28,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: C.yellow,
            display: "flex",
          }}
        >
          {`O ${p.month ? "mês" : "ano"} de ${clipText(first, 18)}`}
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: "Fraunces",
            fontWeight: 800,
            fontSize: p.month ? 128 : 220,
            lineHeight: 0.9,
            letterSpacing: p.month ? -4 : -9,
            color: C.yellow,
            display: "flex",
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: "Fraunces",
            fontWeight: 600,
            fontSize: 64,
            color: C.cream,
            display: "flex",
          }}
        >
          em livros.
        </div>
      </div>

      <div
        style={{ marginTop: 70, display: "flex", flexWrap: "wrap", rowGap: 44 }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{ width: "50%", display: "flex", flexDirection: "column" }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: 96,
                letterSpacing: -4,
                color: C.cream,
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                marginTop: 10,
                fontFamily: "Mono",
                fontSize: 24,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: C.creamDeep,
                opacity: 0.75,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {books.map((b, i) => (
          <div
            key={`${b.id}-${i}`}
            style={{
              display: "flex",
              marginLeft: i ? (n > 3 ? -70 : -30) : 0,
              marginTop: Math.abs(i - mid) * 40,
            }}
          >
            <Cover
              src={covers[i]}
              title={b.title}
              author={b.author}
              width={n > 3 ? 230 : 260}
              palette={b.palette}
              style={{ transform: `rotate(${(i - mid) * 7}deg)` }}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {author && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontFamily: "Mono",
                  fontSize: 22,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: C.creamDeep,
                  opacity: 0.7,
                  display: "flex",
                }}
              >
                Autor mais lido
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: "Fraunces",
                  fontWeight: 600,
                  fontSize: 44,
                  color: C.cream,
                  display: "flex",
                }}
              >
                {clipText(author, 26)}
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: 26,
            color: C.creamDeep,
            opacity: 0.8,
            display: "flex",
          }}
        >
          seu diário de leituras
        </div>
      </div>
    </div>,
    SIZE,
    {
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `inline; filename="trapiche-${user.handle}-${p.year}${p.month ? `-${p.month}` : ""}.png"`,
    },
  );
}
