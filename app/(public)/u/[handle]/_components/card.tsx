import type { ReactNode } from "react";

export default function Card({
  eyebrow,
  title,
  action,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-5 sm:p-6 sm:px-7 ${className}`}
    >
      <div className="flex items-center justify-between gap-4 mb-4.5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mb-0.5">
            {eyebrow}
          </div>
          <h3 className="m-0 text-[16px] font-bold tracking-[-0.005em] text-(--ink)">
            {title}
          </h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
