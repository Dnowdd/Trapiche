import type { ReactNode } from "react";

export default function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <article className="max-w-180 pt-10 md:pt-14 px-5 sm:px-8 lg:px-18.75 pb-14">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-2">
          {eyebrow}
        </div>
        <h1 className="m-0 text-[32px] md:text-[40px] font-extrabold tracking-[-0.025em] text-(--ink) leading-[1.05]">
          {title}
        </h1>
        <div className="mt-2 text-[12px] text-(--ink-4)">
          Atualizado em {updated}
        </div>
        <div className="mt-8 text-[15px] leading-[1.7] text-(--ink-2) [&_h2]:mt-9 [&_h2]:mb-2 [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:text-(--ink) [&_p]:my-3 [&_ul]:my-3 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:my-1 [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </div>
      </article>
    </div>
  );
}
