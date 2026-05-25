const Header = () => {
  return (
    <header className="h-19 flex items-center justify-between px-18.75 bg-(--yellow)" data-screen-label="00 Header">
      <a href="index.html" className="text-[30px] font-extrabold tracking-[-0.02em] text-(--ink-2) flex items-baseline gap-2">
        Trapiche
        <span className="font-mono text-[11px] font-normal text-(--ink-4) tracking-[0.04em]">indie·br</span>
      </a>

      <label className="w-[440px] h-10 rounded-[10px] bg-(--cream) flex items-center gap-2.5 px-4 border border-[rgba(67,62,18,0.07)]">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-(--ink-3) shrink-0"
        >
          <circle cx="11" cy="11" r="7"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
        <input className="border-0 bg-transparent w-full text-[13px] text-(--ink-2) outline-none placeholder:text-(--ink-4)" placeholder="Busque por título, autor, editora, ISBN…" />
        <span className="font-mono text-[10px] text-(--ink-4) border border-[rgba(67,62,18,0.15)] py-0.5 px-1.5 rounded shrink-0">⌘ K</span>
      </label>

      <div className="flex items-center gap-4.5">
        <button className="w-8.5 h-8.5 rounded-lg flex items-center justify-center text-(--ink-2) transition-[background] duration-150 hover:bg-[rgba(67,62,18,0.06)]" aria-label="Notificações">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
          </svg>
        </button>
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-(--cream-deep) flex items-center justify-center text-[13px] font-bold text-(--ink-2) border-[1.5px] border-(--ink-2)">FC</div>
          <div>
            <div className="text-[13px] font-semibold text-(--ink-2) leading-[1.2]">Felipe Carvalho</div>
            <div className="text-[10px] text-(--ink-4) font-mono">@flpcrvlh · 142 livros</div>
          </div>
        </a>
      </div>
    </header>
  );
};

export default Header;
