import Link from "next/link";
import Avatar from "@/components/shared/avatar";
import BookCover from "@/components/shared/book-cover";
import GoalCard from "@/components/goals/goal-card";
import { greeting, type Dashboard as Data } from "@/lib/queries/dashboard";
import { todayISO } from "@/lib/dates";
import Onboarding from "./onboarding";

const card =
  "bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-5 sm:p-6";
const eyebrow =
  "font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)";
const linkCls =
  "text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink)";

export default function Dashboard({ data }: { data: Data }) {
  const { user } = data;
  const first = user.name.split(" ")[0];
  const reading = data.readingNow;

  return (
    <section
      className="pt-8 md:pt-12 px-4 sm:px-8 lg:px-20 pb-4"
      data-screen-label="01 Painel"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-7">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar name={user.name} image={user.image} size={56} />
          <div className="min-w-0">
            <h1 className="m-0 text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] text-(--ink) leading-[1.05]">
              {greeting()}, {first}.
            </h1>
            <p className="m-0 mt-1 text-[14px] text-(--ink-3)">
              {reading.length > 0
                ? `Você está lendo ${reading.length === 1 ? "1 livro" : `${reading.length} livros`} agora.`
                : data.shelfCount > 0
                  ? "Nenhuma leitura em andamento. Que tal começar a próxima?"
                  : "Sua estante está esperando os primeiros livros."}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/search"
            className="h-10 px-4 rounded-[10px] bg-(--ink-2) text-(--yellow) text-[13px] font-semibold inline-flex items-center hover:bg-(--ink)"
          >
            Buscar livro
          </Link>
          <Link
            href={`/u/${user.handle}`}
            className="h-10 px-4 rounded-[10px] border border-[rgba(67,62,18,0.2)] text-(--ink-2) text-[13px] font-medium inline-flex items-center hover:bg-(--yellow-soft)"
          >
            Meu perfil
          </Link>
        </div>
      </div>

      {data.onboarding && (
        <div className="mb-5.5">
          <Onboarding
            steps={data.steps}
            picks={data.picks}
            shelfCount={data.shelfCount}
            handle={user.handle}
            today={todayISO()}
          />
        </div>
      )}

      <div className="grid gap-5.5 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="flex flex-col gap-5.5 min-w-0">
          <div className={card}>
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <div className={eyebrow}>Em andamento</div>
                <h2 className="m-0 mt-0.5 text-[16px] font-bold text-(--ink)">
                  Continuar lendo
                </h2>
              </div>
              {reading.length > 0 && (
                <Link href={`/u/${user.handle}?tab=diario`} className={linkCls}>
                  Diário →
                </Link>
              )}
            </div>
            {reading.length === 0 ? (
              <p className="m-0 text-[13px] text-(--ink-4)">
                Abra um livro e marque “Lendo” pra acompanhar o progresso por
                aqui.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {reading.map((r) => (
                  <Link
                    key={r.book.id}
                    href={`/book/${r.book.id}`}
                    className="group bg-(--cream) border border-[rgba(67,62,18,0.07)] rounded-xl p-4 flex gap-4 transition-colors duration-150 hover:bg-(--yellow-soft)"
                  >
                    <BookCover
                      book={r.book}
                      size="sm"
                      style={{ width: 64, height: 96, flexShrink: 0 }}
                    />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="text-[14px] font-bold text-(--ink-2) leading-[1.2] line-clamp-2">
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
                          <span className="font-mono text-[10px] text-(--ink-4)">
                            {r.page}/{r.total || "?"}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 bg-[rgba(67,62,18,0.1)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-(--ink-2) rounded-full"
                            style={{ width: r.progress + "%" }}
                          />
                        </div>
                        <div className="mt-1.5 text-[11px] font-medium text-(--ink-3) group-hover:text-(--ink)">
                          Atualizar progresso →
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {data.pile.length > 0 && (
            <div className={card}>
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <div className={eyebrow}>Quero ler</div>
                  <h2 className="m-0 mt-0.5 text-[16px] font-bold text-(--ink)">
                    Próximos da pilha
                  </h2>
                </div>
                <Link
                  href={`/u/${user.handle}?tab=estante&status=WANT`}
                  className={linkCls}
                >
                  Ver pilha →
                </Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
                {data.pile.map(({ book }) => (
                  <Link
                    key={book.id}
                    href={`/book/${book.id}`}
                    className="group flex flex-col gap-1.5 min-w-0"
                  >
                    <div className="transition-transform duration-150 group-hover:-translate-y-1">
                      <BookCover
                        book={book}
                        size="md"
                        style={{ width: "100%", aspectRatio: "2/3" }}
                      />
                    </div>
                    <div className="text-[12px] font-semibold text-(--ink-2) leading-tight line-clamp-2">
                      {book.title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-5.5">
          <GoalCard goal={data.goal} isOwner handle={user.handle} />
        </aside>
      </div>
    </section>
  );
}
