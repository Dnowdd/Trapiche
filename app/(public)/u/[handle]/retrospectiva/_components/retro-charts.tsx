import type { RetroStats, Share } from "@/lib/queries/retro-stats";
import { fmtDuration } from "@/lib/progress";

const card =
  "rounded-[18px] border border-[rgba(var(--ink-rgb),0.08)] bg-(--cream-card) p-5";
const eyebrow =
  "font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)";
const fmt = (n: number) => n.toLocaleString("pt-BR");

function PagesByMonth({
  months,
}: {
  months: NonNullable<RetroStats["byMonth"]>;
}) {
  const max = Math.max(...months.map((m) => m.pages));
  if (max <= 0) return null;
  const peak = months.findIndex((m) => m.pages === max);

  return (
    <figure className={`${card} m-0`}>
      <figcaption className="mb-5">
        <div className={eyebrow}>Ritmo</div>
        <div className="mt-0.5 text-[16px] font-bold text-(--ink)">
          Páginas por mês
        </div>
      </figcaption>
      <div
        className="relative h-44 flex items-end gap-1.5 sm:gap-2.5 border-b border-[rgba(var(--ink-rgb),0.14)]"
        aria-hidden
      >
        {months.map((m, i) => {
          const pct = (m.pages / max) * 100;
          return (
            <div
              key={m.label}
              className="group relative flex-1 h-full flex flex-col justify-end items-center"
            >
              {i === peak && (
                <span
                  className="absolute font-mono text-[10px] text-(--ink-3) tabular-nums"
                  style={{ bottom: `calc(${pct}% + 6px)` }}
                >
                  {fmt(m.pages)}
                </span>
              )}
              <span
                className="pointer-events-none absolute z-10 -translate-y-1 opacity-0 transition-opacity duration-100 group-hover:opacity-100 whitespace-nowrap rounded-md bg-(--ink-2) text-(--cream) ring-1 ring-[rgba(255,248,213,0.18)] px-2 py-1 text-[11px] font-medium shadow-[0_8px_20px_-10px_rgba(var(--shadow-rgb),0.6)]"
                style={{ bottom: `calc(${pct}% + ${i === peak ? 22 : 6}px)` }}
              >
                {m.month}: {fmt(m.pages)} pgs · {fmtDuration(m.minutes)}
              </span>
              <span
                className={
                  m.pages
                    ? "block w-full max-w-8 rounded-t-[4px] bg-(--data-mark) transition-[filter] duration-100 group-hover:brightness-110"
                    : "block w-full max-w-8 h-0.5 bg-[rgba(var(--ink-rgb),0.12)]"
                }
                style={m.pages ? { height: `${Math.max(pct, 2)}%` } : undefined}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5 sm:gap-2.5" aria-hidden>
        {months.map((m) => (
          <span
            key={m.label}
            className="flex-1 text-center font-mono text-[9.5px] sm:text-[10px] uppercase tracking-[0.04em] text-(--ink-4)"
          >
            {m.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Páginas e tempo de leitura por mês</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Páginas</th>
            <th scope="col">Tempo</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.label}>
              <th scope="row">{m.month}</th>
              <td>{m.pages}</td>
              <td>{fmtDuration(m.minutes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Ratings({ stats }: { stats: RetroStats }) {
  if (!stats.rated || stats.average == null) return null;
  const max = Math.max(...stats.ratings.map((r) => r.count), 1);
  return (
    <figure className={`${card} m-0`}>
      <figcaption className="flex items-end justify-between gap-3 mb-4">
        <div>
          <div className={eyebrow}>Suas notas</div>
          <div className="mt-0.5 text-[16px] font-bold text-(--ink)">
            Distribuição
          </div>
        </div>
        <div className="text-right">
          <div className="text-[26px] font-extrabold tracking-[-0.02em] leading-none text-(--ink) tabular-nums">
            {stats.average.toLocaleString("pt-BR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </div>
          <div className="mt-1 font-mono text-[10px] text-(--ink-4)">
            média de {stats.rated} {stats.rated === 1 ? "nota" : "notas"}
          </div>
        </div>
      </figcaption>
      <dl className="m-0 flex flex-col gap-2">
        {[...stats.ratings].reverse().map((r) => (
          <div
            key={r.stars}
            className="grid grid-cols-[28px_1fr_24px] items-center gap-2.5"
          >
            <dt className="font-mono text-[11px] text-(--ink-3)">
              {r.stars}
              <span aria-hidden>★</span>
              <span className="sr-only"> estrelas</span>
            </dt>
            <dd className="m-0 h-2 rounded-full bg-[rgba(var(--ink-rgb),0.07)] overflow-hidden">
              <span
                className="block h-full rounded-full bg-(--data-mark)"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </dd>
            <dd className="m-0 text-right font-mono text-[11px] text-(--ink-3) tabular-nums">
              {r.count}
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

function Shares({
  title,
  label,
  rows,
}: {
  title: string;
  label: string;
  rows: Share[];
}) {
  if (!rows.length) return null;
  return (
    <figure className={`${card} m-0`}>
      <figcaption className="mb-4">
        <div className={eyebrow}>{label}</div>
        <div className="mt-0.5 text-[16px] font-bold text-(--ink)">{title}</div>
      </figcaption>
      <dl className="m-0 flex flex-col gap-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3"
          >
            <dt className="text-[13px] text-(--ink-2) font-medium truncate">
              {r.label}
            </dt>
            <dd className="m-0 font-mono text-[11px] text-(--ink-3) tabular-nums">
              {r.percent}% · {r.count}
            </dd>
            <dd
              className="col-span-2 m-0 mt-1.5 h-1.5 rounded-full bg-[rgba(var(--ink-rgb),0.07)] overflow-hidden"
              aria-hidden
            >
              <span
                className="block h-full rounded-full bg-(--data-mark)"
                style={{ width: `${Math.max(r.percent, 2)}%` }}
              />
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

export default function RetroCharts({ stats }: { stats: RetroStats }) {
  const hasMonths = stats.byMonth?.some((m) => m.pages > 0) ?? false;
  const blocks = [
    stats.rated > 0,
    stats.languages.length > 0,
    stats.formats.length > 0,
    stats.decades.length > 0,
  ].filter(Boolean).length;
  if (!hasMonths && !blocks) return null;

  return (
    <section className="mt-10">
      <div className={`${eyebrow} mb-0.5`}>Em números</div>
      <h2 className="m-0 mb-4 text-[20px] font-bold tracking-[-0.01em] text-(--ink)">
        Como foi a leitura
        {stats.averagePages ? (
          <span className="ml-2 font-mono text-[11px] font-normal tracking-normal text-(--ink-4)">
            livros de {fmt(stats.averagePages)} páginas em média
          </span>
        ) : null}
      </h2>
      <div className="flex flex-col gap-4">
        {hasMonths && <PagesByMonth months={stats.byMonth!} />}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Ratings stats={stats} />
          <Shares
            label="Idiomas"
            title="Em que língua"
            rows={stats.languages}
          />
          <Shares label="Formatos" title="Como você leu" rows={stats.formats} />
          <Shares label="Épocas" title="De quando são" rows={stats.decades} />
        </div>
      </div>
    </section>
  );
}
