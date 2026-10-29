const TZ = "America/Sao_Paulo";
const DAY = 86_400_000;

const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];
const MONTHS_LONG = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const WEEKDAYS_LONG = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function dayFromISO(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function today() {
  return dayFromISO(todayISO());
}

export function toISODay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function isISODay(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export function dayOf(ts: Date) {
  return dayFromISO(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(ts),
  );
}

export function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / DAY);
}

export function readingDays(start: Date, end: Date) {
  return Math.max(1, daysBetween(start, end) + 1);
}

export function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * DAY);
}

export function fmtDay(d: Date) {
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function fmtDayShort(d: Date) {
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]}`;
}

export function fmtDayWeek(d: Date) {
  return `${fmtDayShort(d)} · ${WEEKDAYS[d.getUTCDay()]}`;
}

export function fmtMonthYear(d: Date) {
  return `${MONTHS[d.getUTCMonth()]}/${d.getUTCFullYear()}`;
}

export function fmtJoined(ts: Date) {
  const d = dayOf(ts);
  return `${MONTHS_LONG[d.getUTCMonth()]}/${d.getUTCFullYear()}`;
}

export function fmtExpected(target: Date) {
  const diff = daysBetween(today(), target);
  if (diff <= 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff < 7) return `em ${diff} dias`;
  const day = target.getUTCDate();
  const part = day <= 10 ? "início" : day <= 20 ? "meio" : "fim";
  const sameYear = target.getUTCFullYear() === today().getUTCFullYear();
  return `${part} de ${MONTHS[target.getUTCMonth()]}${sameYear ? "" : ` de ${target.getUTCFullYear()}`}`;
}

export function fmtAgo(ts: Date) {
  const diff = daysBetween(dayOf(ts), today());
  if (diff <= 0) {
    const mins = Math.floor((Date.now() - ts.getTime()) / 60_000);
    if (mins < 1) return "agora";
    if (mins < 60) return `há ${mins} min`;
    return `há ${Math.floor(mins / 60)}h`;
  }
  if (diff === 1) return "ontem";
  if (diff < 7) return `há ${diff} dias`;
  if (diff < 14) return "há 1 semana";
  if (diff < 30) return `há ${Math.floor(diff / 7)} semanas`;
  if (diff < 60) return "há 1 mês";
  if (diff < 365) return `há ${Math.floor(diff / 30)} meses`;
  const d = dayOf(ts);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function streakFrom(days: Date[]) {
  const set = new Set(days.map(toISODay));
  let cursor = today();
  if (!set.has(toISODay(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (set.has(toISODay(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(days: Date[]) {
  const sorted = [...new Set(days.map(toISODay))].sort();
  let best = 0;
  let bestYear: number | null = null;
  let run = 0;
  let prev: Date | null = null;
  for (const iso of sorted) {
    const d = dayFromISO(iso);
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    if (run > best) {
      best = run;
      bestYear = d.getUTCFullYear();
    }
    prev = d;
  }
  return { length: best, year: bestYear };
}

export type Precision = "YEAR" | "MONTH" | "DAY";

export interface PartialDate {
  date: Date;
  precision: Precision;
}

export function parsePartialISO(v: string): PartialDate | null {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(v);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = dayFromISO(`${y}-${mo ?? "01"}-${d ?? "01"}`);
  if (Number.isNaN(date.getTime())) return null;
  if (d && toISODay(date) !== `${y}-${mo}-${d}`) return null;
  return { date, precision: d ? "DAY" : mo ? "MONTH" : "YEAR" };
}

export function partialToISO(date: Date | null, precision: Precision) {
  if (!date) return "";
  const iso = toISODay(date);
  return precision === "YEAR"
    ? iso.slice(0, 4)
    : precision === "MONTH"
      ? iso.slice(0, 7)
      : iso;
}

export function periodEnd({ date, precision }: PartialDate) {
  if (precision === "DAY") return date;
  const y = date.getUTCFullYear();
  return precision === "YEAR"
    ? new Date(Date.UTC(y, 11, 31))
    : new Date(Date.UTC(y, date.getUTCMonth() + 1, 0));
}

export function fmtPartial(date: Date | null, precision: Precision) {
  if (!date) return null;
  if (precision === "YEAR") return String(date.getUTCFullYear());
  if (precision === "MONTH") return fmtMonthYear(date);
  return fmtDay(date);
}

export function spanDays(r: {
  startedAt: Date | null;
  startPrecision: Precision;
  endedAt: Date | null;
  endPrecision: Precision;
}) {
  if (!r.startedAt || !r.endedAt) return null;
  if (r.startPrecision !== "DAY" || r.endPrecision !== "DAY") return null;
  return readingDays(r.startedAt, r.endedAt);
}
