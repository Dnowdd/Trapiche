import { ImageResponse } from "next/og";
import { loadBook } from "@/lib/books";
import { sharpCover } from "@/lib/cover-url";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Livro no Trapiche";

async function coverDataUrl(url: string | null) {
  if (!url) return null;
  try {
    const res = await fetch(sharpCover(url), { cache: "no-store" });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    const bytes = Buffer.from(await res.arrayBuffer()).toString("base64");
    return `data:${type};base64,${bytes}`;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await loadBook(id);
  const cover = await coverDataUrl(book?.coverUrl ?? null);
  const title = book?.title ?? "Trapiche";
  const author = book?.authors.join(", ") ?? "";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#ffe767",
        padding: 48,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          background: "#fff8d5",
          borderRadius: 32,
          padding: 56,
          gap: 56,
          alignItems: "center",
        }}
      >
        {cover && (
          <img
            src={cover}
            alt=""
            width={280}
            height={420}
            style={{
              borderRadius: 10,
              objectFit: "cover",
              boxShadow: "0 30px 50px -20px rgba(67,62,18,0.45)",
            }}
          />
        )}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: title.length > 40 ? 52 : 64,
                fontWeight: 800,
                color: "#343600",
                lineHeight: 1.05,
                letterSpacing: -1.5,
              }}
            >
              {title}
            </div>
            {author && (
              <div
                style={{ fontSize: 32, color: "#66623d" }}
              >{`por ${author}`}</div>
            )}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#433e12" }}>
            Trapiche
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
