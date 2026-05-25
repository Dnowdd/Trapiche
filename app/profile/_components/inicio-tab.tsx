import { type ReactNode } from "react";
import BookCover from "@/components/shared/book-cover";
import { ACTIVITY, FAVORITES, READING_NOW } from "../mock-profile";

type ActivityItem = (typeof ACTIVITY)[number];

function ActivityIcon({ kind }: { kind: ActivityItem["kind"] }) {
  const I = (path: ReactNode) => (
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
      {path}
    </svg>
  );
  if (kind === "review")
    return I(
      <>
        <path d="M11.5 2.5l2.5 6 6.5.5-5 4.5 1.5 6.5-5.5-3.5L6 20l1.5-6.5L2.5 9l6.5-.5z"></path>
      </>,
    );
  if (kind === "finished")
    return I(
      <>
        <path d="M4 12l5 5L20 6"></path>
      </>,
    );
  if (kind === "started")
    return I(
      <>
        <path d="M6 4h12v16l-6-3-6 3z"></path>
      </>,
    );
  if (kind === "added")
    return I(
      <>
        <path d="M12 5v14"></path>
        <path d="M5 12h14"></path>
      </>,
    );
  if (kind === "list")
    return I(
      <>
        <path d="M8 6h13"></path>
        <path d="M8 12h13"></path>
        <path d="M8 18h13"></path>
        <circle cx="4" cy="6" r="1"></circle>
        <circle cx="4" cy="12" r="1"></circle>
        <circle cx="4" cy="18" r="1"></circle>
      </>,
    );
  return null;
}

const ActivityRow = ({ a }: { a: ActivityItem }) => {
  let verb;
  if (a.kind === "review")
    verb = (
      <>
        Avaliou <strong>{a.book?.title}</strong> com{" "}
        <strong>{a.stars} ★</strong>
      </>
    );
  if (a.kind === "finished")
    verb = (
      <>
        Terminou <strong>{a.book?.title}</strong> em{" "}
        <strong>{a.days} dias</strong>
      </>
    );
  if (a.kind === "started")
    verb = (
      <>
        Começou a ler <strong>{a.book?.title}</strong>
      </>
    );
  if (a.kind === "added")
    verb = (
      <>
        Adicionou <strong>{a.book?.title}</strong> à lista{" "}
        <strong>{a.list}</strong>
      </>
    );
  if (a.kind === "list")
    verb = (
      <>
        Criou a lista <strong>{a.listName}</strong> com {a.count} livros
      </>
    );

  return (
    <div className="flex gap-4 py-3.5 border-b border-(--rule) items-start last:border-b-0">
      <div className="w-22.5 shrink-0 font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase pt-2">
        {a.when}
      </div>
      <div className="w-7 h-7 shrink-0 rounded-full bg-(--yellow-soft) border border-(--yellow-deep) flex items-center justify-center text-(--ink-2)">
        <ActivityIcon kind={a.kind} />
      </div>
      {a.book && (
        <div className="shrink-0 [&_.cover-title]:text-[7px] [&_.cover-title]:leading-[1.05] [&_.cover-pub]:hidden [&_.cover-author]:hidden [&_.cover-top]:hidden">
          <BookCover book={a.book} size="sm" style={{ width: 30, height: 44, padding: "4px", borderRadius: 2 }} />
        </div>
      )}
      {!a.book && <div className="shrink-0" style={{ width: 30, height: 44 }} />}
      <div className="flex-1 min-w-0 pt-1">
        <div className="text-[13px] text-(--ink-3) [&_strong]:text-(--ink) [&_strong]:font-semibold">{verb}</div>
        {a.text && <div className="mt-1.5 text-[12px] text-(--ink-4) leading-[1.45] border-l-2 border-(--rule) pl-2.5 italic">&quot;{a.text}&quot;</div>}
      </div>
    </div>
  );
};

const InicioTab = () => {
  return (
    <>
      <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-6 px-7">
        <div className="flex items-center justify-between mb-4.5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-0.5">Curadoria do leitor</div>
            <h3 className="m-0 text-[16px] font-bold tracking-[-0.005em] text-(--ink)">Meus 5 livros favoritos</h3>
          </div>
          <a className="text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink)" href="#">
            Editar →
          </a>
        </div>
        <div className="grid grid-cols-5 gap-5">
          {FAVORITES.map((b, i) => (
            <div className="flex flex-col gap-2" key={i}>
              <BookCover book={b} size="md" style={{ width: "100%", aspectRatio: "2/3" }} />
              <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.04em]">
                № <strong className="text-(--ink-2)">0{i + 1}</strong>
              </div>
              <div className="text-[13px] font-semibold text-(--ink-2) tracking-[-0.005em] leading-tight">{b.title}</div>
              <div className="text-[11px] text-(--ink-4)">{b.author}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5.5 bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-6 px-7">
        <div className="flex items-center justify-between mb-4.5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-0.5">Em andamento</div>
            <h3 className="m-0 text-[16px] font-bold tracking-[-0.005em] text-(--ink)">Lendo agora</h3>
          </div>
          <a className="text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink)" href="#">
            Ver pilha →
          </a>
        </div>
        <div className="grid grid-cols-3 gap-4.5">
          {READING_NOW.map((r, i) => (
            <div
              className="bg-(--cream) border border-[rgba(67,62,18,0.07)] rounded-[10px] p-4 flex gap-3.5 [&_.cover-title]:text-[11px] [&_.cover-title]:leading-[1.05] [&_.cover-pub]:hidden [&_.cover-author]:hidden [&_.cover-top]:hidden"
              key={i}
            >
              <BookCover book={r.book} size="sm" style={{ width: 70, height: 100, flexShrink: 0, padding: "8px 7px" }} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-(--ink-2) tracking-[-0.005em] leading-[1.2]">{r.book.title}</div>
                <div className="text-[11px] text-(--ink-4) mt-0.5">{r.book.author}</div>
                <div className="mt-2.5 h-1 bg-[rgba(67,62,18,0.1)] rounded-sm overflow-hidden">
                  <div className="h-full bg-(--ink-2) rounded-sm" style={{ width: r.progress + "%" }}></div>
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[9px] text-(--ink-4) tracking-[0.04em] uppercase [&_strong]:text-(--ink-2)">
                  <span>
                    <strong>{r.progress}%</strong> · {r.page}/{r.total}
                  </span>
                  <span>{r.expected}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5.5 bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-6 px-7">
        <div className="flex items-center justify-between mb-4.5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-0.5">Últimas semanas</div>
            <h3 className="m-0 text-[16px] font-bold tracking-[-0.005em] text-(--ink)">Atividade recente</h3>
          </div>
          <a className="text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink)" href="#">
            Histórico completo →
          </a>
        </div>
        <div className="flex flex-col relative">
          {ACTIVITY.map((a, i) => (
            <ActivityRow key={i} a={a} />
          ))}
        </div>
      </div>
    </>
  );
};

export default InicioTab;
