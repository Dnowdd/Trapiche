import { BOOK_DETAIL } from "../mock-book";

const MyReviewBlock = () => {
  return (
    <section className="mt-14" data-screen-label="05 Sua resenha">
      <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">Sua resenha</div>
      <h2 className="m-0 mb-1.5 text-[24px] font-bold tracking-[-0.015em] text-(--ink)">O que você acha desse livro?</h2>
      <div className="h-4.5" />
      <div className="bg-(--cream-card) border-[1.5px] border-dashed border-[rgba(67,62,18,0.2)] rounded-[18px] py-8 px-9 flex items-center justify-between gap-7.5">
        <div className="max-w-135">
          <h3 className="m-0 mb-1.5 text-[18px] font-bold text-(--ink)">Escreva quando terminar — sem pressa.</h3>
          <p className="m-0 text-[13px] text-(--ink-3) leading-[1.55]">
            Você está no meio da leitura ({BOOK_DETAIL.user.progress}%
            concluído). A gente vai te lembrar quando você marcar como lido. Ou,
            se já tem o que dizer, vai fundo agora.
          </p>
        </div>
        <button className="text-[13px] font-semibold py-3 px-5.5 rounded-lg bg-(--yellow) text-(--ink) border border-(--yellow-deep) cursor-pointer inline-flex gap-2 items-center hover:-translate-y-px">
          Escrever resenha
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default MyReviewBlock;
