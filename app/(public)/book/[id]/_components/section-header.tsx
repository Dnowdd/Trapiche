import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  action,
  small,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  small?: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase mb-1">
          {eyebrow}
        </div>
        <h2
          className={[
            "m-0 font-bold tracking-[-0.015em] text-(--ink)",
            small ? "text-[17px]" : "text-[22px]",
          ].join(" ")}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
