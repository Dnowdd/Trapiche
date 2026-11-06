import { getAuthorCard } from "@/lib/queries/people";
import {
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
  remoteImage,
  Wordmark,
} from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Autor no Trapiche";

export default async function Image({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const name = decodeURIComponent((await params).name);
  const data = await getAuthorCard(name).catch(() => null);
  const display = data?.name ?? name;
  const works = data?.works ?? [];
  const books = works.filter((w) => w.cover.coverUrl).slice(0, 5);
  const [photo, covers] = await Promise.all([
    remoteImage(data?.profile?.photoUrl, 300),
    Promise.all(books.map((w) => coverImage(w.cover.coverUrl, 220))),
  ]);
  const life =
    data?.profile?.born || data?.profile?.died
      ? [data.profile.born ?? "?", data.profile.died].filter(Boolean).join("–")
      : null;
  const nameSize = fit(display, [
    [16, 84],
    [26, 68],
    [40, 54],
    [999, 44],
  ]);

  return ogImage(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: C.cream,
        backgroundImage: `linear-gradient(115deg, ${C.cream} 0%, ${C.cream} 55%, ${C.yellowSoft} 100%)`,
        fontFamily: "Inter",
      }}
    >
      <Grain opacity={0.04} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px 54px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div
            style={{
              width: 170,
              height: 170,
              borderRadius: 999,
              border: `5px solid ${C.ink2}`,
              boxShadow: `0 0 0 9px ${C.yellow}`,
              background: C.yellow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
              fontWeight: 800,
              fontSize: 60,
              color: C.ink2,
            }}
          >
            {photo ? (
              <img
                src={photo}
                alt=""
                width={170}
                height={170}
                style={{ objectFit: "cover", borderRadius: 999 }}
              />
            ) : (
              initials(display)
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <Eyebrow color={C.ink4}>
              {life ? `Autor · ${life}` : "Autor"}
            </Eyebrow>
            <div
              style={{
                marginTop: 12,
                fontFamily: "Fraunces",
                fontWeight: 600,
                fontSize: nameSize,
                lineHeight: 1.02,
                letterSpacing: -2,
                color: C.ink,
                display: "flex",
              }}
            >
              {clipText(display, 50)}
            </div>
            {works.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 26,
                  color: C.ink3,
                  display: "flex",
                }}
              >
                {fmtNum(works.length)} {works.length === 1 ? "obra" : "obras"}{" "}
                no catálogo
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <Wordmark color={C.ink} accent={C.ink} letter={C.yellow} size={28} />
          <div style={{ display: "flex", gap: 16 }}>
            {books.map((w, i) => (
              <Cover
                key={w.cover.id}
                src={covers[i]}
                title={w.cover.title}
                author={display}
                width={118}
                palette={w.cover.palette}
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
  );
}
