export default function About({ description }: { description: string | null }) {
  if (!description) return null;
  const paragraphs = description.split(/\n+/).filter((p) => p.trim());
  return (
    <section className="mt-14" data-screen-label="03 Sobre">
      <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1.5">
        Sobre o livro
      </div>
      <h2 className="m-0 mb-1.5 text-[24px] font-bold tracking-[-0.015em] text-(--ink)">
        Sinopse
      </h2>
      <div className="h-5.5" />
      <div className="text-[16px] leading-[1.65] text-(--ink-2) max-w-190 text-pretty [&>p]:mb-4 [&>p:first-child::first-letter]:text-[52px] [&>p:first-child::first-letter]:font-extrabold [&>p:first-child::first-letter]:float-left [&>p:first-child::first-letter]:leading-[0.9] [&>p:first-child::first-letter]:[padding:4px_8px_0_0] [&>p:first-child::first-letter]:text-(--ink)">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}
