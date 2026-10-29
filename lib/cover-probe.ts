import { cachedValue } from "./api-cache";
import { sharpCover } from "./cover-url";

function imageSize(bytes: Uint8Array) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    return { w: view.getUint32(16), h: view.getUint32(20) };
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < bytes.length) {
    const marker = bytes[i + 1];
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (marker === 0xc0 || marker === 0xc2)
      return {
        h: (bytes[i + 5] << 8) | bytes[i + 6],
        w: (bytes[i + 7] << 8) | bytes[i + 8],
      };
    i += 2 + len;
  }
  return null;
}

function withZoom(url: string, zoom: number) {
  try {
    const u = new URL(sharpCover(url));
    if (u.hostname !== "books.google.com") return null;
    u.searchParams.set("zoom", String(zoom));
    return u.toString();
  } catch {
    return null;
  }
}

async function sizeOf(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return imageSize(new Uint8Array(await res.arrayBuffer()));
}

// Google serves an "image not available" placeholder (JPEG or PNG) for missing high-res covers; only the aspect ratio gives it away.
export async function bestCover(url: string | null | undefined) {
  if (!url) return null;
  if (!withZoom(url, 1)) return url;
  return (
    (await cachedValue(`cover:${url}`, () => probeCover(url))) ??
    sharpCover(url)
  );
}

async function probeCover(url: string): Promise<string | null> {
  const small = withZoom(url, 1);
  if (!small) return null;
  try {
    const [s, first] = await Promise.all(
      [small, withZoom(url, 4)!].map((u) => sizeOf(u).catch(() => null)),
    );
    if (!s) return null;
    const fits = (b: { w: number; h: number } | null) =>
      b != null && b.w > s.w && Math.abs(b.h / b.w - s.h / s.w) < 0.04;
    if (fits(first)) return withZoom(url, 4)!;
    for (const zoom of [3, 2]) {
      const candidate = withZoom(url, zoom)!;
      if (fits(await sizeOf(candidate).catch(() => null))) return candidate;
    }
    return sharpCover(url);
  } catch {
    return null;
  }
}
