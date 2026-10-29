import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookCover from "@/components/shared/book-cover";
import Stars from "@/components/shared/stars";
import { db } from "@/lib/db";
import { MONTHS_LONG, today } from "@/lib/dates";
import { getViewerId } from "@/lib/session";
import {
  fmtMinutes,
  getRetrospective,
  type Retrospective,
} from "@/lib/queries/stats";
import ShareButton from "./_components/share-button";

interface Props {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ ano?: string; mes?: string }>;
}

function parsePeriod(sp: { ano?: string; mes?: string }) {
  const now = today();
  const thisYear = now.getUTCFullYear();
  const year = Number(sp.ano) || thisYear;
  const month = sp.mes ? Number(sp.mes) : undefined;
  if (!Number.isInteger(year) || year < 1900 || year > thisYear) return null;
  if (month !== undefined) {
    if (!Number.isInteger(month) || month < 1 || month > 12) return null;
    if (year === thisYear && month > now.getUTCMonth() + 1) return null;
  }
  return { year, month };
}

const userOf = (handle: string) =>
  db.user.findUnique({
    where: { handle },
    select: { id: true, name: true, handle: true },
  });

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ handle }, sp] = await Promise.all([params, searchParams]);
  const user = await userOf(handle);
  const period = parsePeriod(sp);
  if (!user || !period) return {};
  const label = period.month
    ? `${MONTHS_LONG[period.month - 1]} de ${period.year}`
    : String(period.year);
  return {
    title: `Retrospectiva ${label} · ${user.name}`,
    description: `O que ${user.name} leu em ${label} no Trapiche.`,
  };
}

const fmt = (n: number) => n.toLocaleString("pt-BR");
const plural = (n: number, one: string, many: string) =>
  `${fmt(n)} ${n === 1 ? one : many}`;

function retroHref(handle: string, year: number, month?: number | null) {
  return `/u/${handle}/retrospectiva?ano=${year}${month ? `&mes=${month}` : ""}`;
}

function BigStat({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="text-[34px] sm:text-[48px] font-extrabold tracking-[-0.035em] leading-none text-(--yellow) tabular-nums">
        {value}
      </div>
      <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-(--cream-deep) opacity-80">
        {label}
      </div>
      {hint && (
        <div className="text-[11px] text-(--cream-deep) opacity-60">{hint}</div>
      )}
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-0.5">
        {eyebrow}
      </div>
      <h2 className="m-0 mb-4 text-[20px] font-bold tracking-[-0.01em] text-(--ink)">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Highlights({ h }: { h: Retrospective["highlights"] }) {
  const items = [
    { label: "Favorito", data: h.favorite },
    { label: "Mais tempo lendo", data: h.mostTime },
    { label: "Mais longo", data: h.longest },
    { label: "Mais rápido", data: h.fastest },
  ].filter(
    (x, i, all) =>
      x.data != null &&
      all.findIndex((y) => y.data?.book.id === x.data?.book.id) === i,
  );
  if (!items.length) return null;
  return (
    <Section eyebrow="Destaques" title="Os livros que marcaram">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ label, data }) => (
          <Link
            key={label}
            href={`/book/${data!.book.id}`}
            className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[16px] p-4 flex gap-3.5 transition-colors duration-150 hover:bg-(--yellow-soft) [&_.cover-title]:text-[10px] [&_.cover-title]:leading-[1.05] [&_.cover-pub]:hidden [&_.cover-author]:hidden [&_.cover-top]:hidden"
          >
            <BookCover
              book={data!.book}
              size="sm"
              sizes="56px"
              style={{ width: 56, height: 84, flexShrink: 0, padding: 6 }}
            />
            <div className="min-w-0 flex flex-col gap-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
                {label}
              </div>
              <div className="text-[14px] font-bold text-(--ink-2) leading-tight line-clamp-2">
                {data!.book.title}
              </div>
              <div className="text-[11px] text-(--ink-4) truncate">
                {data!.book.author}
              </div>
              {label === "Favorito" && data!.rating != null ? (
                <Stars value={data!.rating} className="text-[13px]" />
              ) : (
                data!.detail && (
                  <div className="text-[12px] font-semibold text-(--ink-3)">
                    {data!.detail}
                  </div>
                )
              )}
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function Ranking({
  eyebrow,
  title,
  items,
  unit,
}: {
  eyebrow: string;
  title: string;
  items: { name: string; count: number }[];
  unit: [string, string];
}) {
  return (
    <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[16px] p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-0.5">
        {eyebrow}
      </div>
      <h3 className="m-0 mb-3 text-[16px] font-bold text-(--ink)">{title}</h3>
      <ol className="m-0 p-0 list-none flex flex-col gap-2.5">
        {items.map((x, i) => (
          <li key={x.name} className="flex items-baseline gap-3">
            <span className="font-mono text-[12px] text-(--ink-4) w-4">
              {i + 1}
            </span>
            <span className="flex-1 min-w-0 truncate text-[14px] font-semibold text-(--ink-2)">
              {x.name}
            </span>
            <span className="font-mono text-[11px] text-(--ink-4)">
              {plural(x.count, ...unit)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MonthGrid({ data, handle }: { data: Retrospective; handle: string }) {
  const months = data.months!;
  const max = Math.max(1, ...months.map((m) => m.pages));
  return (
    <Section eyebrow="Mês a mês" title="Sua cápsula do tempo">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {months.map((m) => {
          const future = m.month > data.lastMonth;
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-bold text-(--ink-2)">
                  {m.name}
                </span>
                {!future && (
                  <span className="font-mono text-[11px] text-(--ink-3)">
                    {plural(m.books, "livro", "livros")}
                  </span>
                )}
              </div>
              <div className="h-1.5 my-3 bg-[rgba(67,62,18,0.07)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-(--ink-2)"
                  style={{ width: `${(m.pages / max) * 100}%` }}
                />
              </div>
              {future ? (
                <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-(--ink-4)">
                  Ainda não chegou
                </div>
              ) : (
                <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-(--ink-4) flex flex-wrap gap-x-2">
                  <span>{plural(m.pages, "página", "páginas")}</span>
                  {m.minutes > 0 && <span>· {fmtMinutes(m.minutes)}</span>}
                </div>
              )}
              {m.covers.length > 0 && (
                <div className="mt-3 flex -space-x-3 [&_.cover-title]:text-[6px] [&_.cover-pub]:hidden [&_.cover-author]:hidden [&_.cover-top]:hidden">
                  {m.covers.map((c) => (
                    <BookCover
                      key={c.id}
                      book={c}
                      size="sm"
                      sizes="32px"
                      style={{
                        width: 32,
                        height: 48,
                        padding: 3,
                        boxShadow: "0 2px 6px rgba(67,62,18,0.25)",
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          );
          const cls =
            "rounded-[14px] border border-[rgba(67,62,18,0.08)] p-4 flex flex-col";
          return future ? (
            <div key={m.month} className={`${cls} opacity-45`}>
              {body}
            </div>
          ) : (
            <Link
              key={m.month}
              href={retroHref(handle, data.year, m.month)}
              className={`${cls} bg-(--cream-card) transition-[background-color,transform] duration-150 hover:bg-(--yellow-soft) hover:-translate-y-0.5`}
            >
              {body}
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

function PeriodNav({ data, handle }: { data: Retrospective; handle: string }) {
  const chip =
    "h-8 px-3.5 inline-flex items-center rounded-full border text-[12px] font-semibold transition-colors duration-150";
  const idle = `${chip} border-[rgba(67,62,18,0.15)] text-(--ink-3) hover:bg-(--yellow-soft)`;
  const active = `${chip} border-(--ink-2) bg-(--ink-2) text-(--yellow)`;
  const m = data.month;
  const prev = m
    ? m === 1
      ? { y: data.year - 1, m: 12 }
      : { y: data.year, m: m - 1 }
    : null;
  const next = m
    ? m === 12
      ? { y: data.year + 1, m: 1 }
      : { y: data.year, m: m + 1 }
    : null;
  const hasPrev = prev && data.years.includes(prev.y);
  const now = today();
  const hasNext =
    next &&
    (next.y < now.getUTCFullYear() ||
      (next.y === now.getUTCFullYear() && next.m <= now.getUTCMonth() + 1));

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {m ? (
        <>
          <Link href={retroHref(handle, data.year)} className={idle}>
            ← {data.year} inteiro
          </Link>
          {hasPrev && (
            <Link href={retroHref(handle, prev!.y, prev!.m)} className={idle}>
              {MONTHS_LONG[prev!.m - 1]}
            </Link>
          )}
          <span className={active}>{MONTHS_LONG[m - 1]}</span>
          {hasNext && (
            <Link href={retroHref(handle, next!.y, next!.m)} className={idle}>
              {MONTHS_LONG[next!.m - 1]}
            </Link>
          )}
        </>
      ) : (
        data.years.map((y) =>
          y === data.year ? (
            <span key={y} className={active}>
              {y}
            </span>
          ) : (
            <Link key={y} href={retroHref(handle, y)} className={idle}>
              {y}
            </Link>
          ),
        )
      )}
    </nav>
  );
}

export default async function RetrospectivePage({
  params,
  searchParams,
}: Props) {
  const [{ handle }, sp, viewerId] = await Promise.all([
    params,
    searchParams,
    getViewerId(),
  ]);
  const user = await userOf(handle);
  const period = parsePeriod(sp);
  if (!user || !period) notFound();
  const data = await getRetrospective(user.id, period.year, period.month);
  const owner = viewerId === user.id;
  const first = user.name.split(" ")[0];
  const t = data.totals;
  const empty = t.books === 0 && t.pages === 0 && t.minutes === 0;
  const title = period.month
    ? owner
      ? `Seu ${MONTHS_LONG[period.month - 1].toLowerCase()} em livros`
      : `O ${MONTHS_LONG[period.month - 1].toLowerCase()} de ${first} em livros`
    : owner
      ? `Seu ${data.year} em livros`
      : `O ${data.year} de ${first} em livros`;

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="pt-7 md:pt-10 px-4 sm:px-8 lg:px-15 pb-12 md:pb-15">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <Link
            href={`/u/${user.handle}`}
            className="text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink)"
          >
            ← {user.name}
          </Link>
          <PeriodNav data={data} handle={user.handle} />
        </div>

        <section className="relative overflow-hidden rounded-[22px] bg-(--ink-2) text-(--cream) px-6 sm:px-10 py-8 sm:py-11">
          <div
            aria-hidden
            className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-(--yellow) opacity-[0.08]"
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.1em] text-(--yellow) opacity-80">
                Retrospectiva · {data.label}
              </div>
              <h1 className="m-0 mt-2 text-[30px] sm:text-[44px] font-extrabold tracking-[-0.03em] leading-[1.02] text-(--cream) text-balance">
                {title}
              </h1>
            </div>
            {!empty && (
              <ShareButton
                path={retroHref(user.handle, data.year, data.month)}
                title={`Retrospectiva ${data.label} de ${user.name}`}
              />
            )}
          </div>
          {empty ? (
            <p className="relative mt-6 mb-0 max-w-120 text-[15px] leading-[1.55] text-(--cream-deep)">
              {owner
                ? "Nenhuma leitura terminada nem sessão registrada neste período. Marque livros como lidos e anote sessões no diário para encher a cápsula."
                : "Nenhuma leitura registrada neste período."}
            </p>
          ) : (
            <div className="relative mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-7">
              <BigStat
                value={fmt(t.books)}
                label={t.books === 1 ? "livro lido" : "livros lidos"}
                hint={
                  t.rereads
                    ? plural(t.rereads, "releitura", "releituras")
                    : undefined
                }
              />
              <BigStat value={fmt(t.pages)} label="páginas" />
              <BigStat
                value={t.minutes ? fmtMinutes(t.minutes) : "—"}
                label="de leitura"
                hint={t.minutes ? undefined : "registre sessões no diário"}
              />
              <BigStat
                value={fmt(t.readingDays)}
                label={t.readingDays === 1 ? "dia lendo" : "dias lendo"}
              />
              <BigStat
                value={fmt(t.streak)}
                label="dias seguidos"
                hint="maior sequência"
              />
            </div>
          )}
        </section>

        {data.goal?.target != null && (
          <div className="mt-5 bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[16px] p-5">
            <div className="flex items-baseline justify-between gap-3 mb-2.5">
              <span className="text-[14px] font-bold text-(--ink-2)">
                Meta de {data.year}: {data.goal.done} de{" "}
                {plural(data.goal.target, "livro", "livros")}
              </span>
              <span className="font-mono text-[11px] text-(--ink-3)">
                {data.goal.pct}%
              </span>
            </div>
            <div className="h-2.5 bg-[rgba(67,62,18,0.08)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-(--ink-2)"
                style={{ width: `${data.goal.pct}%` }}
              />
            </div>
          </div>
        )}

        {data.months && <MonthGrid data={data} handle={user.handle} />}

        {!empty && (
          <>
            <Highlights h={data.highlights} />

            {(data.authors.length > 0 || data.genres.length > 0) && (
              <Section
                eyebrow="Preferências"
                title="Quem e o que mais apareceu"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.authors.length > 0 && (
                    <Ranking
                      eyebrow="Autores"
                      title="Mais lidos"
                      items={data.authors}
                      unit={["livro", "livros"]}
                    />
                  )}
                  {data.genres.length > 0 && (
                    <Ranking
                      eyebrow="Gêneros"
                      title="Mais frequentes"
                      items={data.genres}
                      unit={["livro", "livros"]}
                    />
                  )}
                </div>
              </Section>
            )}

            {(t.reviews > 0 || t.abandoned > 0) && (
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.06em] text-(--ink-3)">
                {t.reviews > 0 && (
                  <span>
                    {plural(t.reviews, "resenha escrita", "resenhas escritas")}
                  </span>
                )}
                {t.abandoned > 0 && (
                  <span>
                    {plural(
                      t.abandoned,
                      "livro abandonado",
                      "livros abandonados",
                    )}
                  </span>
                )}
              </div>
            )}

            {data.books.length > 0 && (
              <Section
                eyebrow="Estante do período"
                title={plural(
                  data.books.length,
                  "leitura terminada",
                  "leituras terminadas",
                )}
              >
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-4">
                  {data.books.map((b, i) => (
                    <Link
                      key={`${b.id}-${i}`}
                      href={`/book/${b.id}`}
                      className="flex flex-col gap-1.5 transition-transform duration-120 hover:-translate-y-0.5"
                    >
                      <BookCover
                        book={b}
                        size="sm"
                        sizes="(max-width: 640px) 30vw, 140px"
                        style={{ width: "100%", aspectRatio: "2/3" }}
                      />
                      <div className="text-[12px] font-semibold text-(--ink-2) leading-tight line-clamp-2">
                        {b.title}
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-(--ink-4) uppercase tracking-[0.04em]">
                        {b.rating != null && (
                          <Stars
                            value={b.rating}
                            className="text-[11px] normal-case"
                          />
                        )}
                        {b.when && <span>{b.when}</span>}
                        {b.reread && <span>· releitura</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
