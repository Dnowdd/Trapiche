import { BOOK_DETAIL } from "../mock-book";

const MyReading = () => {
  const u = BOOK_DETAIL.user;

  if (u.status !== "lendo" && u.status !== "relendo") return null;
  return (
    <section className="mt-14" data-screen-label="02 Sua leitura">
      <div className="bg-(--ink-2) text-(--cream) rounded-[18px] py-7 px-8 grid grid-cols-[1fr_320px] gap-10">
        <div>
          <div className="font-mono text-[11px] text-(--cream-deep) tracking-[0.06em] uppercase">
            {u.status === "relendo" ? "Sua releitura" : "Sua leitura"}
          </div>
          <h3 className="mt-1.5 mb-4 text-[24px] font-bold text-(--yellow) tracking-[-0.015em]">Você está aqui agora</h3>

          <div className="text-[64px] font-extrabold text-(--yellow) leading-[1] tracking-[-0.03em]">
            {u.progress}
            <span className="text-[28px] ml-1 text-(--cream-deep)">%</span>
          </div>
          <div className="mt-1.5 font-mono text-[12px] text-(--cream-deep) tracking-[0.04em]">
            página {u.page} de {u.total}
          </div>
          <div className="mt-4 h-2 bg-[rgba(255,231,103,0.15)] rounded-[4px] overflow-hidden">
            <div className="h-full bg-(--yellow) rounded-[4px]" style={{ width: u.progress + "%" }} />
          </div>

          <div className="mt-4 flex gap-9">
            <div className="flex flex-col gap-0.5">
              <span className="text-[18px] font-bold text-(--cream) tracking-[-0.01em]">{u.started}</span>
              <span className="font-mono text-[10px] text-(--cream-deep) tracking-[0.06em] uppercase">Começou em</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[18px] font-bold text-(--cream) tracking-[-0.01em]">{u.expectedDone}</span>
              <span className="font-mono text-[10px] text-(--cream-deep) tracking-[0.06em] uppercase">Previsão</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[18px] font-bold text-(--cream) tracking-[-0.01em]">{u.streakDays} dias</span>
              <span className="font-mono text-[10px] text-(--cream-deep) tracking-[0.06em] uppercase">Sequência</span>
            </div>
            {u.times_read > 1 && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[18px] font-bold text-(--cream) tracking-[-0.01em]">{u.times_read}ª vez</span>
                <span className="font-mono text-[10px] text-(--cream-deep) tracking-[0.06em] uppercase">Releitura</span>
              </div>
            )}
          </div>

          {u.note && (
            <div className="mt-3.5 italic text-[13px] text-(--cream-deep) border-l-2 border-[rgba(255,231,103,0.4)] pl-3 leading-[1.5]">
              &quot;{u.note}&quot;
            </div>
          )}

          <div className="mt-5.5 flex gap-2">
            <button className="text-[12px] font-medium py-[9px] px-3.5 rounded-[7px] bg-(--yellow) text-(--ink) hover:-translate-y-px">+ Registrar leitura de hoje</button>
            <button className="text-[12px] font-medium py-[9px] px-3.5 rounded-[7px] bg-transparent border border-[rgba(255,248,213,0.3)] text-(--cream) hover:bg-[rgba(255,248,213,0.05)] hover:-translate-y-px">Marcar como concluído</button>
            <button className="text-[12px] font-medium py-[9px] px-3.5 rounded-[7px] bg-transparent border border-[rgba(255,248,213,0.3)] text-(--cream) hover:bg-[rgba(255,248,213,0.05)] hover:-translate-y-px">Editar progresso</button>
          </div>
        </div>

        <div className="bg-[rgba(255,248,213,0.06)] border border-[rgba(255,248,213,0.1)] rounded-[10px] py-4 px-4.5">
          <div className="font-mono text-[11px] text-(--cream-deep) tracking-[0.06em] uppercase mb-2.5 flex justify-between">
            <span>Últimas sessões</span>
            <span>{u.sessions.length}</span>
          </div>
          {u.sessions.map((s, i) => (
            <div className="grid grid-cols-[90px_1fr_auto] gap-3 text-[12px] items-center py-1.5 border-b border-[rgba(255,248,213,0.08)] last:border-b-0" key={i}>
              <span className="font-mono text-[10px] text-(--cream-deep) tracking-[0.04em] uppercase">{s.date}</span>
              <span className="text-(--cream) font-medium [&_strong]:text-(--yellow) [&_strong]:font-bold">
                <strong>{s.pages} pgs</strong> · até pág. {s.page_end}
              </span>
              <span className="text-(--cream-deep) font-mono text-[11px]">{s.minutes}min</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MyReading;
