import { BOOK_DETAIL } from "../mock-book";

const TechDetails = () => {
  return (
    <section className="mt-14" data-screen-label="10 Detalhes">
      <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">Ficha técnica</div>
      <h2 className="m-0 mb-1.5 text-[24px] font-bold tracking-[-0.015em] text-(--ink)">Detalhes desta edição</h2>
      <div className="h-5.5" />
      <div className="bg-(--cream) border border-[rgba(67,62,18,0.07)] rounded-[18px] py-7 px-8 grid grid-cols-3 gap-y-5.5 gap-x-9">
        <div>
          <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Título original</div>
          <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.original.title}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Idioma original</div>
          <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.original.lang}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Edição</div>
          <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.edition_no}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Editora</div>
          <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.publisher}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Publicação</div>
          <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.year}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Idioma desta edição</div>
          <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.language}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Páginas</div>
          <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.pages}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Formato</div>
          <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.format}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Dimensões</div>
          <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.dimensions}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">Peso</div>
          <div className="text-[14px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.weight}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">ISBN-10</div>
          <div className="font-mono text-[13px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.isbn10}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">ISBN-13</div>
          <div className="font-mono text-[13px] text-(--ink-2) font-medium">{BOOK_DETAIL.meta.isbn13}</div>
        </div>
      </div>
      <div className="mt-3.5 font-mono text-[10px] text-(--ink-4) tracking-[0.04em] uppercase">
        Dados sincronizados via Google Books · última atualização há 3 dias
      </div>
    </section>
  );
};

export default TechDetails;
