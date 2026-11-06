"use client";

import { cn } from "@/lib/utils";

export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start justify-between gap-4 py-3 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-(--ink-2) leading-snug">
          {label}
        </span>
        {description && (
          <span className="block mt-0.5 text-[12.5px] text-(--ink-4) leading-normal">
            {description}
          </span>
        )}
      </span>
      <span className="relative shrink-0 mt-0.5">
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="block w-10 h-6 rounded-full bg-[rgba(67,62,18,0.18)] transition-colors duration-150 peer-checked:bg-(--ink-2) peer-focus-visible:shadow-[0_0_0_4px_rgba(255,231,103,0.55)]" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-(--cream) shadow-[0_1px_3px_rgba(67,62,18,0.35)] transition-transform duration-150 peer-checked:translate-x-4 peer-checked:bg-(--yellow)" />
      </span>
    </label>
  );
}
