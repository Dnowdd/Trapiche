import type { ReactNode } from "react";
import Link from "next/link";

export default function SupportShell({
  eyebrow,
  title,
  back,
  aside,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  back?: { href: string; label: string };
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="max-w-230 mx-auto pt-7 md:pt-10 px-4 sm:px-8 pb-12 md:pb-15">
        {back && (
          <Link
            href={back.href}
            className="inline-block mb-4 font-mono text-[11px] uppercase tracking-[0.06em] text-(--ink-4) hover:text-(--ink-2)"
          >
            ← {back.label}
          </Link>
        )}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div className="min-w-0">
            <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase">
              {eyebrow}
            </div>
            <h1 className="m-0 mt-2 text-[26px] md:text-[34px] font-extrabold tracking-[-0.025em] text-(--ink) leading-[1.1] wrap-break-word">
              {title}
            </h1>
          </div>
          {aside}
        </div>
        {children}
      </div>
    </div>
  );
}
