import { db } from "./db";
import { normalize } from "./editions";

const NUMBERED =
  /^(.*?)[\s,;:.(\-–—]*(?:#|n[.ºo°]*\s*|v(?:ol(?:ume)?)?\.?\s*|livro\s+|book\s+|tomo\s+|parte\s+)?(\d{1,3}(?:[.,]\d)?)\)?\s*$/i;

export function parseSeries(raw: string | null | undefined) {
  if (!raw) return null;
  const clean = raw.replace(/\s+/g, " ").trim();
  const m = clean.match(NUMBERED);
  if (!m) return null;
  const name = m[1]
    .replace(/^[(\[]|[)\]]$/g, "")
    .replace(/[\s,;:.(\-–—]+$/, "")
    .trim();
  const position = Number(m[2].replace(",", "."));
  if (name.length < 2 || !Number.isFinite(position) || position <= 0)
    return null;
  return { name, position };
}

export function seriesSlug(name: string) {
  return (
    normalize(name).replace(/&/g, "e").replace(/\s+/g, "-").slice(0, 80) ||
    "serie"
  );
}

export async function placeInSeries(
  workId: string,
  name: string,
  position: number,
) {
  const slug = seriesSlug(name);
  const series = await db.series.upsert({
    where: { slug },
    create: { slug, name },
    update: {},
  });
  await db.seriesWork.deleteMany({
    where: { workId, NOT: { seriesId: series.id } },
  });
  await db.seriesWork.upsert({
    where: { seriesId_workId: { seriesId: series.id, workId } },
    create: { seriesId: series.id, workId, position },
    update: { position },
  });
  return series;
}

export async function autoLinkSeries(book: {
  workId: string | null;
  seriesName: string | null;
  seriesPosition: number | null;
}) {
  if (!book.workId || !book.seriesName || !book.seriesPosition) return;
  const existing = await db.seriesWork.findFirst({
    where: { workId: book.workId },
    select: { seriesId: true },
  });
  if (existing) return;
  await placeInSeries(book.workId, book.seriesName, book.seriesPosition);
}
