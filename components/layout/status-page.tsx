import Link from "next/link";
import type { ReactNode } from "react";

export default function StatusPage({
  code,
  title,
  body,
  action,
}: {
  code: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="py-20 md:py-28 px-6 flex flex-col items-center text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--ink-4)">
          {code}
        </div>
        <h1 className="m-0 mt-3 text-[34px] md:text-[48px] font-extrabold tracking-[-0.03em] leading-[1.02] text-(--ink) max-w-140 text-balance">
          {title}
        </h1>
        <p className="m-0 mt-4 text-[15px] text-(--ink-3) leading-[1.55] max-w-110">
          {body}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {action}
          <Link
            href="/"
            className="h-10 px-4.5 rounded-[10px] border border-[rgba(67,62,18,0.2)] text-[13px] font-semibold text-(--ink-2) inline-flex items-center hover:bg-(--yellow-soft)"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
