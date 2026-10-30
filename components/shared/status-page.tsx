import type { ReactNode } from "react";

export default function StatusPage({
  code,
  title,
  children,
  actions,
}: {
  code: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 px-4 sm:px-8 py-20 md:py-28 flex flex-col items-center text-center"
    >
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--ink-4)">
        {code}
      </div>
      <h1 className="m-0 mt-3 text-[32px] sm:text-[44px] font-extrabold tracking-[-0.03em] text-(--ink) leading-[1.05] max-w-140 text-balance">
        {title}
      </h1>
      <p className="m-0 mt-4 text-[15px] text-(--ink-3) leading-[1.55] max-w-110">
        {children}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {actions}
      </div>
    </div>
  );
}

export const primaryBtn =
  "h-11 px-5 rounded-[10px] bg-(--ink-2) text-(--cream) text-[14px] font-semibold inline-flex items-center cursor-pointer hover:bg-(--ink)";
export const ghostBtn =
  "h-11 px-5 rounded-[10px] border border-[rgba(67,62,18,0.2)] text-(--ink-2) text-[14px] font-medium inline-flex items-center cursor-pointer hover:bg-(--yellow-soft)";
