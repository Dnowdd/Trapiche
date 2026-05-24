const Quote = () => {
  return (
    <section
      className="mt-16 py-30 flex flex-col items-center gap-8 text-center"
      data-screen-label="08 Citacao"
    >
      <div className="font-['Inter',serif] text-[80px] leading-[0.6] text-(--ink-3) opacity-40 font-bold">
        &quot;
      </div>

      <blockquote className="m-0 max-w-205 text-[22px] leading-normal text-(--ink-3) font-normal tracking-[-0.005em] text-balance">
        Nunca, porém, vendia os livros, que ia empilhando num canto do trapiche,
        sob tijolos, para que os ratos não os roessem. Lia-os todos numa ânsia
        que era quase febre.
      </blockquote>

      <cite className="inline-flex items-center gap-3 not-italic font-['JetBrains_Mono',monospace] text-[11px] text-(--ink-4) tracking-[0.08em] uppercase">
        <span className="w-7 h-px bg-(--ink-4)"></span>
        Jorge Amado · Capitães da Areia
        <span className="w-7 h-px bg-(--ink-4)"></span>
      </cite>
    </section>
  );
};

export default Quote;
