import { getListPage } from "@/lib/queries/lists";
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
export const alt = "Lista de livros no Trapiche";

const SLOTS = [
  { x: 0, y: 120, r: -8 },
  { x: 120, y: 60, r: -3 },
  { x: 250, y: 20, r: 2 },
  { x: 140, y: 230, r: 6 },
  { x: 290, y: 200, r: -4 },
  { x: 10, y: 300, r: 3 },
];

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const list = await getListPage(id, null);
  if (!list || list.visibility !== "PUBLIC")
    return ogImage(
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
      </div>,
    );

  const books = list.items.slice(0, 6).map((i) => i.book);
  const [covers, avatar] = await Promise.all([
    Promise.all(books.map((b) => coverImage(b.coverUrl, 260))),
    avatarImage(list.owner, 96),
  ]);
  const count = list.items.length;
  const titleSize = fit(list.title, [
    [20, 70],
    [36, 58],
    [60, 48],
    [999, 40],
  ]);
  const order = [5, 0, 1, 3, 4, 2].filter((i) => i < books.length);

  return ogImage(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: C.yellow,
        fontFamily: "Inter",
        padding: 28,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          position: "relative",
          background: C.cream,
          borderRadius: 34,
          overflow: "hidden",
        }}
      >
        <Grain opacity={0.04} />
        <div
          style={{
            width: 570,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 0 46px 56px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Eyebrow color={C.ink4}>
              Lista · {fmtNum(count)} {count === 1 ? "livro" : "livros"}
              {list.followers > 0
                ? ` · ${fmtNum(list.followers)} seguindo`
                : ""}
            </Eyebrow>
            <div
              style={{
                marginTop: 18,
                fontFamily: "Fraunces",
                fontWeight: 600,
                fontSize: titleSize,
                lineHeight: 1.04,
                letterSpacing: -1.6,
                color: C.ink,
                display: "flex",
              }}
            >
              {clipText(list.title, 80)}
            </div>
            {list.note && (
              <div
                style={{
                  marginTop: 16,
                  fontSize: 22,
                  lineHeight: 1.45,
                  color: C.ink3,
                  display: "flex",
                }}
              >
                {clipText(list.note, 120)}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  border: `3px solid ${C.ink2}`,
                  background: C.creamDeep,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  fontWeight: 800,
                  fontSize: 19,
                  color: C.ink2,
                }}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt=""
                    width={52}
                    height={52}
                    style={{ borderRadius: 999 }}
                  />
                ) : (
                  initials(list.owner.name)
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 21, fontWeight: 600, color: C.ink2 }}>
                  {list.owner.name}
                </div>
                <div
                  style={{
                    fontFamily: "Mono",
                    fontSize: 16,
                    color: C.ink4,
                    display: "flex",
                  }}
                >
                  {`@${list.owner.handle}`}
                </div>
              </div>
            </div>
            <Wordmark
              color={C.ink}
              accent={C.ink}
              letter={C.yellow}
              size={26}
            />
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", position: "relative" }}>
          {order.map((i) => {
            const b = books[i];
            const slot = SLOTS[i];
            return (
              <div
                key={`${b.id}-${i}`}
                style={{
                  position: "absolute",
                  left: slot.x + 10,
                  top: slot.y - 10,
                  display: "flex",
                }}
              >
                <Cover
                  src={covers[i]}
                  title={b.title}
                  author={b.author}
                  width={150}
                  palette={b.palette}
                  style={{ transform: `rotate(${slot.r}deg)` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>,
  );
}
