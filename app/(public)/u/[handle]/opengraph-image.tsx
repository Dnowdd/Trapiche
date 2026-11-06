import { db } from "@/lib/db";
import { toCover } from "@/lib/books";
import { bookSummarySelect } from "@/lib/books";
import { privacySelect, profileAccess } from "@/lib/privacy";
import { finishedCount } from "@/lib/queries/stats";
import {
  avatarImage,
  C,
  clipText,
  coverImage,
  Cover,
  Eyebrow,
  fit,
  fmtNum,
  Grain,
  initials,
  ogImage,
  OG_SIZE,
  Wordmark,
} from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Perfil de leitor no Trapiche";

function Avatar({
  src,
  name,
  size,
}: {
  src: string | null;
  name: string;
  size: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        border: `5px solid ${C.ink2}`,
        boxShadow: `0 0 0 8px ${C.yellow}`,
        background: C.creamDeep,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        fontFamily: "Inter",
        fontWeight: 800,
        fontSize: size * 0.36,
        color: C.ink2,
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          style={{ objectFit: "cover", borderRadius: 999 }}
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const user = await db.user.findUnique({
    where: { handle },
    select: {
      id: true,
      name: true,
      handle: true,
      image: true,
      bio: true,
      createdAt: true,
      ...privacySelect,
    },
  });
  if (!user) return ogImage(<Blank />);
  const access = profileAccess(user, false, false);
  const avatar = await avatarImage(user, 260);
  const nameSize = fit(user.name, [
    [14, 76],
    [22, 64],
    [32, 52],
    [999, 44],
  ]);

  if (!access.canView)
    return ogImage(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: C.cream,
          fontFamily: "Inter",
          position: "relative",
        }}
      >
        <Grain opacity={0.04} />
        <Avatar src={avatar} name={user.name} size={180} />
        <div
          style={{
            marginTop: 40,
            fontFamily: "Fraunces",
            fontWeight: 600,
            fontSize: nameSize,
            color: C.ink,
            letterSpacing: -1.5,
            display: "flex",
          }}
        >
          {user.name}
        </div>
        <Eyebrow style={{ marginTop: 14 }}>
          @{user.handle} · perfil reservado
        </Eyebrow>
        <div style={{ position: "absolute", bottom: 46, display: "flex" }}>
          <Wordmark color={C.ink} accent={C.ink} letter={C.yellow} size={28} />
        </div>
      </div>,
    );

  const year = new Date().getUTCFullYear();
  const [read, thisYear, reviews, quotes, favorites] = await Promise.all([
    access.sections.shelf
      ? db.userBook.count({ where: { userId: user.id, status: "READ" } })
      : Promise.resolve(null),
    access.sections.shelf
      ? finishedCount(user.id, year)
      : Promise.resolve(null),
    db.review.count({ where: { userId: user.id, hiddenAt: null } }),
    db.quote.count({
      where: { userId: user.id, private: false, hiddenAt: null },
    }),
    db.userBook.findMany({
      where: { userId: user.id, favoritePosition: { not: null } },
      orderBy: { favoritePosition: "asc" },
      take: 5,
      select: { book: { select: bookSummarySelect } },
    }),
  ]);
  const shelf =
    favorites.length > 0 || !access.sections.shelf
      ? favorites.map((f) => f.book)
      : (
          await db.userBook.findMany({
            where: { userId: user.id, status: { in: ["READ", "READING"] } },
            orderBy: { statusChangedAt: "desc" },
            take: 5,
            select: { book: { select: bookSummarySelect } },
          })
        ).map((r) => r.book);
  const covers = await Promise.all(
    shelf.map((b) => coverImage(b.coverUrl, 220)),
  );
  const stats = [
    read != null && { value: read, label: "lidos" },
    thisYear != null && { value: thisYear, label: `em ${year}` },
    { value: reviews, label: reviews === 1 ? "resenha" : "resenhas" },
    quotes > 0 && {
      value: quotes,
      label: quotes === 1 ? "citação" : "citações",
    },
  ]
    .filter((s): s is { value: number; label: string } => Boolean(s))
    .slice(0, 4);

  return ogImage(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: C.cream,
        backgroundImage: `linear-gradient(180deg, ${C.yellow} 0%, ${C.cream} 55%)`,
        fontFamily: "Inter",
      }}
    >
      <Grain opacity={0.04} />
      <div
        style={{
          width: shelf.length ? 660 : 1200,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 0 54px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <Avatar src={avatar} name={user.name} size={128} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Eyebrow color={C.ink3} style={{ fontSize: 16 }}>
                No Trapiche desde {user.createdAt.getUTCFullYear()}
              </Eyebrow>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: "Mono",
                  fontSize: 24,
                  color: C.ink2,
                  display: "flex",
                }}
              >
                @{user.handle}
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 30,
              fontFamily: "Fraunces",
              fontWeight: 600,
              fontSize: nameSize,
              lineHeight: 1.02,
              letterSpacing: -1.8,
              color: C.ink,
              display: "flex",
            }}
          >
            {clipText(user.name, 40)}
          </div>
          {user.bio && (
            <div
              style={{
                marginTop: 14,
                fontSize: 23,
                lineHeight: 1.4,
                color: C.ink3,
                display: "flex",
                maxWidth: 560,
              }}
            >
              {clipText(user.bio, 110)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={{ display: "flex", gap: 36 }}>
            {stats.map((s) => (
              <div
                key={s.label}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 50,
                    letterSpacing: -2,
                    color: C.ink,
                    lineHeight: 1,
                  }}
                >
                  {fmtNum(s.value)}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: "Mono",
                    fontSize: 15,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    color: C.ink4,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <Wordmark color={C.ink} accent={C.ink} letter={C.yellow} size={28} />
        </div>
      </div>
      {shelf.length > 0 && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {shelf.map((b, i) => {
              const mid = (shelf.length - 1) / 2;
              return (
                <div
                  key={b.id}
                  style={{
                    display: "flex",
                    marginLeft: i ? -92 : 0,
                    marginTop: Math.abs(i - mid) * 26,
                  }}
                >
                  <Cover
                    src={covers[i]}
                    title={b.title}
                    author={b.authors[0]}
                    width={168}
                    palette={toCover(b).palette}
                    style={{ transform: `rotate(${(i - mid) * 6}deg)` }}
                  />
                </div>
              );
            })}
          </div>
          <Eyebrow color={C.ink4} style={{ fontSize: 15, marginTop: 34 }}>
            {favorites.length ? "Livros favoritos" : "Na estante"}
          </Eyebrow>
        </div>
      )}
    </div>,
  );
}

function Blank() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.yellow,
      }}
    >
      <Wordmark size={72} color={C.ink} accent={C.ink} letter={C.yellow} />
    </div>
  );
}
