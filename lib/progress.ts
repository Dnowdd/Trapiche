export type ReadingFormat = "PRINT" | "EBOOK" | "AUDIO";

export const FORMAT_LABEL: Record<ReadingFormat, string> = {
  PRINT: "Físico",
  EBOOK: "E-book",
  AUDIO: "Audiolivro",
};

export interface ProgressState {
  format: ReadingFormat;
  currentPage: number;
  progressPercent: number | null;
  audioPosition: number | null;
  audioLength: number | null;
}

export function fmtDuration(minutes: number) {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (!h) return `${rest}min`;
  return rest ? `${h}h${String(rest).padStart(2, "0")}` : `${h}h`;
}

export function parseDuration(raw: string | number | null | undefined) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number")
    return Number.isFinite(raw) ? Math.round(raw) : null;
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  let m = s.match(/^(\d{1,3}):(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = s.match(/^(\d{1,3})\s*h\s*(?:(\d{1,2})\s*(?:m|min)?)?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2] ?? 0);
  m = s.match(/^(\d{1,5})\s*(?:m|min)?$/);
  if (m) return Number(m[1]);
  return NaN;
}

export function fractionOf(s: ProgressState, pageCount: number | null) {
  switch (s.format) {
    case "EBOOK":
      return s.progressPercent != null
        ? Math.min(1, Math.max(0, s.progressPercent / 100))
        : 0;
    case "AUDIO":
      return s.audioLength
        ? Math.min(1, Math.max(0, (s.audioPosition ?? 0) / s.audioLength))
        : null;
    default:
      return pageCount
        ? Math.min(1, Math.max(0, s.currentPage / pageCount))
        : null;
  }
}

export function progressOf(s: ProgressState, pageCount: number | null) {
  const fraction = fractionOf(s, pageCount);
  const percent = fraction == null ? null : Math.round(fraction * 100);
  let label: string;
  let short: string;
  if (s.format === "EBOOK") {
    label = `${percent ?? 0}% do e-book`;
    short = `${percent ?? 0}%`;
  } else if (s.format === "AUDIO") {
    const pos = fmtDuration(s.audioPosition ?? 0);
    label = s.audioLength
      ? `${pos} de ${fmtDuration(s.audioLength)} ouvidos`
      : `${pos} ouvidos`;
    short = s.audioLength ? `${pos}/${fmtDuration(s.audioLength)}` : pos;
  } else {
    label = `página ${s.currentPage}${pageCount ? ` de ${pageCount}` : ""}`;
    short = pageCount ? `${s.currentPage}/${pageCount}` : `p. ${s.currentPage}`;
  }
  return {
    format: s.format,
    fraction,
    percent,
    label,
    short,
    big:
      percent != null
        ? `${percent}%`
        : s.format === "AUDIO"
          ? fmtDuration(s.audioPosition ?? 0)
          : `p. ${s.currentPage}`,
  };
}

export type Progress = ReturnType<typeof progressOf>;

export function pageFromFraction(fraction: number, pageCount: number | null) {
  return pageCount ? Math.round(fraction * pageCount) : 0;
}
