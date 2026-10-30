import Link from "next/link";
import type { ReactNode } from "react";
import BookCover from "@/components/shared/book-cover";
import { fmtRating } from "@/components/shared/stars";
import type { getInicio, ProfileData } from "@/lib/queries/profile";
import FavoritesEditor from "./favorites-editor";
import Card from "./card";
import SpoilerText from "@/components/shared/spoiler-text";
import GoalCard from "@/components/goals/goal-card";
import type { GoalData } from "@/lib/queries/stats";

type Data = Awaited<ReturnType<typeof getInicio>>;
type ActivityItem = Data["activity"][number];

function ActivityIcon({ kind }: { kind: ActivityItem["kind"] }) {
  const paths: Record<ActivityItem["kind"], ReactNode> = {
    REVIEW: (
      <path d="M11.5 2.5l2.5 6 6.5.5-5 4.5 1.5 6.5-5.5-3.5L6 20l1.5-6.5L2.5 9l6.5-.5z" />
    ),
    FINISHED: <path d="M4 12l5 5L20 6" />,
    STARTED: <path d="M6 4h12v16l-6-3-6 3z" />,
    ABANDONED: <path d="M18 6 6 18M6 6l12 12" />,
    ADDED_TO_SHELF: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    ADDED_TO_LIST: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    LIST_CREATED: (
      <>
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <circle cx="4" cy="6" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="4" cy="18" r="1" />
      </>
    ),
  };
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[kind]}
    </svg>
  );
}

function verb(a: ActivityItem) {
  const book = a.book && (
    <Link href={`/book/${a.book.id}`} className="hover:underline">
      <strong>{a.book.title}</strong>
    </Link>
  );
  const list = a.list && (
    <Link href={`/lists/${a.list.id}`} className="hover:underline">
      <strong>{a.list.title}</strong>
    </Link>
  );
  switch (a.kind) {
    case "REVIEW":
      return (
        <>
          Avaliou {book} com <strong>{fmtRating(a.rating ?? 0)} ★</strong>
        </>
      );
    case "FINISHED":
      return (
        <>
          Terminou {book}
          {a.days != null && (
            <>
              {" "}
              em{" "}
              <strong>
                {a.days} {a.days === 1 ? "dia" : "dias"}
              </strong>
            </>
          )}
        </>
      );
    case "STARTED":
      return <>Começou a ler {book}</>;
    case "ABANDONED":
      return <>Abandonou {book}</>;
    case "ADDED_TO_SHELF":
      return (
        <>
          Adicionou {book} à lista <strong>{a.text ?? "Quero ler"}</strong>
        </>
      );
    case "ADDED_TO_LIST":
      return (
        <>
          Adicionou {book} à lista {list}
        </>
      );
    case "LIST_CREATED":
      return (
        <>
          Criou a lista {list}
          {a.list && a.list.count > 0 && (
            <>
              {" "}
              com {a.list.count} {a.list.count === 1 ? "livro" : "livros"}
            </>
          )}
        </>
      );
  }
}

function ActivityRow({ a }: { a: ActivityItem }) {
  const quote = a.kind === "REVIEW" || a.kind === "ABANDONED" ? a.text : null;
  return (
    <div className="flex gap-3 sm:gap-4 py-3.5 border-b border-(--rule) items-start last:border-b-0">
      <div className="hidden sm:block w-22.5 shrink-0 font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase pt-2">
        {a.when}
      </div>
      <div className="w-7 h-7 shrink-0 rounded-full bg-(--yellow-soft) border border-(--yellow-deep) flex items-center justify-center text-(--ink-2)">
        <ActivityIcon kind={a.kind} />
      </div>
      {a.book ? (
        <Link href={`/book/${a.book.id}`} className="shrink-0">
          <BookCover
            book={a.book}
            size="sm"
            style={{ width: 30, height: 44, padding: "4px", borderRadius: 2 }}
          />
        </Link>
      ) : (
        <div className="shrink-0 w-7.5 h-11" />
      )}
      <div className="flex-1 min-w-0 pt-1">
        <div className="text-[13px] text-(--ink-3) [&_strong]:text-(--ink) [&_strong]:font-semibold">
          {verb(a)}
        </div>
        <div className="sm:hidden mt-0.5 font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">
          {a.when}
        </div>
        {quote && (
          <SpoilerText
            spoiler={a.spoiler}
            className="m-0 mt-1.5 text-[12px] text-(--ink-4) leading-[1.45] border-l-2 border-(--rule) pl-2.5 italic"
          >
            &quot;{quote}&quot;
          </SpoilerText>
        )}
      </div>
    </div>
  );
}

const linkCls =
  "text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink)";

const SHELF_ROWS = [
  { id: "READ", label: "Lidos" },
  { id: "READING", label: "Lendo" },
  { id: "WANT", label: "Quero ler" },
  { id: "REREADING", label: "Relendo" },
  { id: "ABANDONED", label: "Abandonados" },
] as const;

function ShelfCard({
  shelf,
  handle,
}: {
  shelf: ProfileData["shelf"];
  handle: string;
}) {
  const max = Math.max(1, ...Object.values(shelf));
  return (
    <Card eyebrow="Na estante" title="Por status">
      <div className="flex flex-col gap-1 -mx-2">
        {SHELF_ROWS.map((r) => (
          <Link
            key={r.id}
            href={`/u/${handle}?tab=estante&status=${r.id}`}
            scroll={false}
            className="group grid grid-cols-[92px_1fr_32px] items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-(--yellow-soft)"
          >
            <span className="text-[13px] text-(--ink-3) group-hover:text-(--ink-2)">
              {r.label}
            </span>
            <span className="h-1.5 rounded-full bg-[rgba(67,62,18,0.07)] overflow-hidden">
              <span
                className="block h-full rounded-full bg-(--ink-2)"
                style={{ width: `${(shelf[r.id] / max) * 100}%` }}
              />
            </span>
            <span className="text-right text-[13px] font-semibold text-(--ink-2) tabular-nums">
              {shelf[r.id]}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function ActivityCard({
  data,
  handle,
  page,
}: {
  data: Data;
  handle: string;
  page: number;
}) {
  const full = page > 0;
  return (
    <Card
      eyebrow={full ? "Tudo desde o começo" : "Últimas semanas"}
      title={full ? "Histórico completo" : "Atividade recente"}
      action={
        full ? (
          <Link href={`/u/${handle}`} scroll={false} className={linkCls}>
            ← Voltar
          </Link>
        ) : data.hasMoreActivity ? (
          <Link
            href={`/u/${handle}?tab=inicio&historico=1`}
            scroll={false}
            className={linkCls}
          >
            Histórico completo →
          </Link>
        ) : null
      }
    >
      {data.activity.length === 0 ? (
        <p className="m-0 text-[13px] text-(--ink-4)">Nada por aqui ainda.</p>
      ) : (
        <div className="flex flex-col relative">
          {data.activity.map((a) => (
            <ActivityRow key={a.id} a={a} />
          ))}
        </div>
      )}
      {full && data.hasMoreActivity && (
        <Link
          href={`/u/${handle}?tab=inicio&historico=${page + 1}`}
          scroll={false}
          className="mt-4 self-start inline-flex h-9 items-center px-4 rounded-[10px] border border-[rgba(67,62,18,0.18)] text-[13px] font-medium text-(--ink-2) hover:bg-(--yellow-soft)"
        >
          Carregar mais
        </Link>
      )}
    </Card>
  );
}

export default function InicioTab({
  data,
  goal,
  shelf,
  handle,
  isOwner,
  page,
}: {
  data: Data;
  goal: GoalData | null;
  shelf: ProfileData["shelf"];
  handle: string;
  isOwner: boolean;
  page: number;
}) {
  if (page > 0) return <ActivityCard data={data} handle={handle} page={page} />;

  const showGoal = goal && (isOwner || goal.target != null || goal.done > 0);

  return (
    <div className="grid gap-5.5 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="flex flex-col gap-5.5 min-w-0">
        <Card
          eyebrow="Curadoria do leitor"
          title={isOwner ? "Meus 5 livros favoritos" : "5 livros favoritos"}
          action={
            isOwner && data.favorites.length > 0 ? (
              <FavoritesEditor favorites={data.favorites} />
            ) : null
          }
        >
          {data.favorites.length === 0 ? (
            <div className="grid grid-cols-5 gap-3 sm:gap-5">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="aspect-2/3 rounded border border-dashed border-[rgba(67,62,18,0.18)] flex items-center justify-center font-mono text-[11px] text-(--ink-5)"
                >
                  0{i + 1}
                </div>
              ))}
              <p className="col-span-5 m-0 text-[13px] text-(--ink-4)">
                {isOwner
                  ? "Abra um livro e clique em “Adicionar aos favoritos”. Cabem 5 aqui."
                  : "Nenhum favorito escolhido ainda."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-5">
              {data.favorites.map((b, i) => (
                <Link
                  href={`/book/${b.id}`}
                  className="group flex flex-col gap-2 min-w-0"
                  key={b.id}
                >
                  <div className="transition-transform duration-150 group-hover:-translate-y-1">
                    <BookCover
                      book={b}
                      size="md"
                      style={{ width: "100%", aspectRatio: "2/3" }}
                    />
                  </div>
                  <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em]">
                    № <strong className="text-(--ink-2)">0{i + 1}</strong>
                  </div>
                  <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight line-clamp-2">
                    {b.title}
                  </div>
                  <div className="text-[11px] text-(--ink-4) -mt-1 truncate">
                    {b.author}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card
          eyebrow="Em andamento"
          title="Lendo agora"
          action={
            <Link
              href={`/u/${handle}?tab=estante&status=WANT`}
              scroll={false}
              className={linkCls}
            >
              Ver pilha →
            </Link>
          }
        >
          {data.readingNow.length === 0 ? (
            <p className="m-0 text-[13px] text-(--ink-4)">
              {isOwner
                ? "Nenhuma leitura em andamento. Abra um livro e marque “Lendo”."
                : "Nenhuma leitura em andamento."}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {data.readingNow.map((r) => (
                <Link
                  href={`/book/${r.book.id}`}
                  className="bg-(--cream) border border-[rgba(67,62,18,0.07)] rounded-xl p-4 flex gap-4 transition-colors duration-150 hover:bg-(--yellow-soft)"
                  key={r.book.id}
                >
                  <BookCover
                    book={r.book}
                    size="sm"
                    style={{ width: 64, height: 96, flexShrink: 0 }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="text-[14px] font-bold text-(--ink-2) tracking-[-0.005em] leading-[1.2] line-clamp-2">
                      {r.book.title}
                    </div>
                    <div className="text-[11px] text-(--ink-4) mt-0.5 truncate">
                      {r.book.author}
                    </div>
                    <div className="mt-auto pt-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[18px] font-extrabold tracking-[-0.02em] text-(--ink) tabular-nums">
                          {r.progress}%
                        </span>
                        <span className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em]">
                          {r.page}/{r.total || "?"}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 bg-[rgba(67,62,18,0.1)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-(--ink-2) rounded-full"
                          style={{ width: r.progress + "%" }}
                        />
                      </div>
                      <div className="mt-1.5 font-mono text-[9.5px] text-(--ink-4) tracking-[0.04em] uppercase">
                        {r.expected}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <ActivityCard data={data} handle={handle} page={0} />
      </div>

      <aside className="flex flex-col gap-5.5 lg:sticky lg:top-6">
        {showGoal && <GoalCard goal={goal} isOwner={isOwner} handle={handle} />}
        <ShelfCard shelf={shelf} handle={handle} />
      </aside>
    </div>
  );
}
