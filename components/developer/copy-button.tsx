"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export default function CopyButton({
  value,
  label = "Copiar",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value).catch(() => null);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className={cn(
        "h-8 px-3 rounded-lg border border-[rgba(67,62,18,0.2)] text-[12px] font-semibold text-(--ink-2) cursor-pointer hover:bg-(--yellow-soft) shrink-0",
        className,
      )}
    >
      {copied ? "Copiado!" : label}
    </button>
  );
}
