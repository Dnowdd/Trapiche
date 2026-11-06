import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CSSProperties, ReactNode } from "react";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { sharpCover } from "./cover-url";
import { db } from "./db";

export const OG_SIZE = { width: 1200, height: 630 };

export const C = {
  yellow: "#ffe767",
  yellowDeep: "#f5dd5c",
  yellowSoft: "#fff1a8",
  cream: "#fff8d5",
  creamCard: "#fffddf",
  creamDeep: "#f8e99d",
  ink: "#343600",
  ink2: "#433e12",
  ink3: "#66623d",
  ink4: "#7c7d58",
  dark: "#2b2710",
  darker: "#1f1c0b",
};

const FONT_FILES = [
  ["Fraunces", "fraunces-latin-600-normal.ttf", 600, "normal"],
  ["Fraunces", "fraunces-latin-800-normal.ttf", 800, "normal"],
  ["Fraunces", "fraunces-latin-500-italic.ttf", 500, "italic"],
  ["Inter", "inter-latin-400-normal.ttf", 400, "normal"],
  ["Inter", "inter-latin-600-normal.ttf", 600, "normal"],
  ["Inter", "inter-latin-800-normal.ttf", 800, "normal"],
  ["Mono", "jetbrains-mono-latin-500-normal.ttf", 500, "normal"],
] as const;

let fontsPromise: Promise<
  {
    name: string;
    data: Buffer;
    weight: 400 | 500 | 600 | 800;
    style: "normal" | "italic";
  }[]
> | null = null;

function fonts() {
  fontsPromise ??= Promise.all(
    FONT_FILES.map(async ([name, file, weight, style]) => ({
      name,
      data: await readFile(join(process.cwd(), "assets/fonts", file)),
      weight,
      style,
    })),
  );
  return fontsPromise;
}

export async function ogImage(node: ReactNode) {
  return new ImageResponse(node as React.ReactElement, {
    ...OG_SIZE,
    fonts: await fonts(),
    headers: {
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

async function toPngDataUrl(buf: ArrayBuffer | Buffer, width: number) {
  const png = await sharp(Buffer.from(buf as ArrayBuffer))
    .resize({ width, withoutEnlargement: false })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

const imageCache = new Map<string, Promise<string | null>>();
const CACHE_LIMIT = 300;

async function fetchImage(url: string, width: number) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(attempt ? 9000 : 6000),
        headers: { "User-Agent": "Trapiche/1.0 (og-image)" },
      });
      if (!res.ok) return null;
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 1200) return null;
      return await toPngDataUrl(buf, width);
    } catch {
      continue;
    }
  }
  return null;
}

export function remoteImage(url: string | null | undefined, width = 360) {
  if (!url) return Promise.resolve(null);
  const key = `${width}:${url}`;
  const hit = imageCache.get(key);
  if (hit) return hit;
  if (imageCache.size >= CACHE_LIMIT)
    imageCache.delete(imageCache.keys().next().value!);
  const pending = fetchImage(url, width).then((r) => {
    if (!r) imageCache.delete(key);
    return r;
  });
  imageCache.set(key, pending);
  return pending;
}

export const coverImage = (url: string | null | undefined, width = 360) =>
  remoteImage(url ? sharpCover(url) : null, width);

export async function avatarImage(
  user: { id: string; image: string | null },
  width = 240,
) {
  if (!user.image) return null;
  if (user.image.startsWith("/api/avatars/")) {
    const avatar = await db.userAvatar.findUnique({
      where: { userId: user.id },
      select: { data: true },
    });
    if (!avatar) return null;
    return toPngDataUrl(Buffer.from(avatar.data), width).catch(() => null);
  }
  return remoteImage(user.image, width);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

export function fit(text: string, sizes: [number, number][]) {
  for (const [max, size] of sizes) if (text.length <= max) return size;
  return sizes.at(-1)![1];
}

export function clipText(text: string, max: number) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

export function Wordmark({
  color = C.cream,
  accent = C.yellow,
  letter = C.dark,
  size = 30,
}: {
  color?: string;
  accent?: string;
  letter?: string;
  size?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: size * 0.95,
          height: size * 0.95,
          borderRadius: 999,
          background: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: letter,
          fontFamily: "Fraunces",
          fontWeight: 800,
          fontSize: size * 0.62,
        }}
      >
        T
      </div>
      <div
        style={{
          fontFamily: "Inter",
          fontWeight: 800,
          fontSize: size,
          letterSpacing: -0.8,
          color,
        }}
      >
        Trapiche
      </div>
    </div>
  );
}

export function Eyebrow({
  children,
  color = C.ink4,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "Mono",
        fontSize: 19,
        letterSpacing: 2.4,
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Cover({
  src,
  title,
  author,
  width,
  palette,
  style,
}: {
  src: string | null;
  title: string;
  author?: string;
  width: number;
  palette?: { bg: string; fg: string };
  style?: CSSProperties;
}) {
  const height = Math.round(width * 1.5);
  const frame: CSSProperties = {
    width,
    height,
    borderRadius: Math.max(4, width * 0.025),
    boxShadow:
      "0 2px 4px rgba(20,18,4,0.25), 0 30px 60px -18px rgba(20,18,4,0.65)",
    display: "flex",
    flexShrink: 0,
    overflow: "hidden",
    position: "relative",
    ...style,
  };
  if (src)
    return (
      <div style={frame}>
        <img
          src={src}
          alt=""
          width={width}
          height={height}
          style={{ width, height, objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: Math.max(6, width * 0.05),
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.25), rgba(255,255,255,0.12) 45%, rgba(0,0,0,0))",
          }}
        />
      </div>
    );
  const p = palette ?? { bg: C.ink2, fg: C.yellow };
  return (
    <div
      style={{
        ...frame,
        background: p.bg,
        color: p.fg,
        flexDirection: "column",
        justifyContent: "space-between",
        padding: width * 0.1,
      }}
    >
      <div
        style={{
          fontFamily: "Fraunces",
          fontWeight: 600,
          fontSize: Math.max(12, width * 0.13),
          lineHeight: 1.1,
          display: "flex",
        }}
      >
        {clipText(title, 60)}
      </div>
      {author && (
        <div
          style={{
            fontFamily: "Mono",
            fontSize: Math.max(8, width * 0.055),
            letterSpacing: 1,
            textTransform: "uppercase",
            opacity: 0.8,
            display: "flex",
          }}
        >
          {clipText(author, 30)}
        </div>
      )}
    </div>
  );
}

export function Stars({
  value,
  size = 26,
  color = C.yellow,
  empty = "rgba(255,248,213,0.22)",
}: {
  value: number;
  size?: number;
  color?: string;
  empty?: string;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <div
            key={i}
            style={{
              position: "relative",
              display: "flex",
              width: size,
              height: size,
            }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24">
              <path
                d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"
                fill={empty}
              />
            </svg>
            {fill > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: size * fill,
                  height: size,
                  overflow: "hidden",
                  display: "flex",
                }}
              >
                <svg width={size} height={size} viewBox="0 0 24 24">
                  <path
                    d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"
                    fill={color}
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Grain({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        opacity,
        backgroundImage:
          "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)",
        backgroundSize: "6px 6px",
      }}
    />
  );
}

export const fmtNum = (n: number) => n.toLocaleString("pt-BR");
export const fmtRating = (n: number) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
