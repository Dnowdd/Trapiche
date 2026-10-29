const Footer = () => {
  const cols = [
    {
      h: "Produto",
      items: [
        "Benefícios",
        "Como funciona",
        "Planos",
        "Para curadores",
        "Novidades",
      ],
    },
    {
      h: "Comunidade",
      items: ["Estantes", "Resenhas", "Clube do mês", "Eventos", "Manifesto"],
    },
    {
      h: "Trapiche",
      items: ["Sobre", "Equipe", "Imprensa", "Contato", "Trabalhe conosco"],
    },
  ];

  return (
    <footer
      className="bg-(--yellow) pt-12 md:pt-16 px-4 sm:px-8 lg:px-18.75 pb-9 flex flex-col gap-10 md:gap-12"
      data-screen-label="09 Footer"
    >
      <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="text-[30px] font-extrabold text-(--ink-2) tracking-[-0.02em] mb-2">
            Trapiche
          </div>
          <p className="m-0 mb-4.5 text-[13px] text-(--ink-3) max-w-70 leading-normal">
            O porto seguro das suas leituras. Indie, brasileiro e construído com
            carinho por leitoras e leitores.
          </p>
          <div className="flex gap-2">
            {["IG", "TW", "RS", "ML"].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="w-8 h-8 rounded-lg bg-(--cream) flex items-center justify-center text-(--ink-2) border border-[rgba(67,62,18,0.1)] transition-transform duration-120 hover:-translate-y-px"
              >
                <span className="font-mono text-[11px] font-bold">{s}</span>
              </a>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <h4 className="m-0 mb-3.5 text-[12px] text-(--ink-3) font-mono tracking-[0.08em] uppercase font-medium">
              {c.h}
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              {c.items.map((i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-[14px] text-(--ink-2) font-medium hover:text-(--ink) hover:underline hover:underline-offset-[3px]"
                  >
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="h-px bg-(--yellow-deep)"></div>
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center text-[12px] text-(--ink-3)">
        <span className="font-mono text-[11px] tracking-[0.04em]">
          © 2026 TRAPICHE · FEITO EM SALVADOR · BA
        </span>
        <div className="flex gap-7">
          <a href="#">Termos de uso</a>
          <a href="#">Privacidade</a>
          <a href="#">Cookies</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
