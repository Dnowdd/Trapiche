import Link from "next/link";

const Footer = () => {
  return (
    <footer
      className="bg-(--yellow) pt-12 md:pt-16 px-4 sm:px-8 lg:px-18.75 pb-9 flex flex-col gap-8"
      data-screen-label="09 Footer"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <Link
            href="/"
            className="text-[30px] font-extrabold text-(--ink-2) tracking-[-0.02em]"
          >
            Trapiche
          </Link>
          <p className="m-0 mt-2 text-[13px] text-(--ink-3) max-w-80 leading-normal">
            O porto seguro das suas leituras. Indie, brasileiro e construído com
            carinho por leitoras e leitores.
          </p>
        </div>
        <nav className="flex gap-6 text-[14px] font-medium text-(--ink-2)">
          <Link
            href="/#como-funciona"
            className="hover:underline underline-offset-[3px]"
          >
            Como funciona
          </Link>
          <Link
            href="/#populares"
            className="hover:underline underline-offset-[3px]"
          >
            Populares
          </Link>
        </nav>
      </div>
      <div className="h-px bg-(--yellow-deep)" />
      <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center font-mono text-[11px] tracking-[0.04em] text-(--ink-3)">
        <span>© 2026 TRAPICHE · FEITO EM SALVADOR · BA</span>
        <div className="flex gap-5 uppercase">
          <Link href="/termos" className="hover:text-(--ink)">
            Termos
          </Link>
          <Link href="/privacidade" className="hover:text-(--ink)">
            Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
