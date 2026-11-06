import { cn } from "@/lib/utils";

export default function TagChip({
  name,
  color,
  isPrivate,
  active = true,
  className,
  children,
}: {
  name: string;
  color: string;
  isPrivate?: boolean;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-7 pl-2.5 pr-3 rounded-full text-[12px] font-semibold border max-w-56",
        active
          ? "text-[#fff8d5]"
          : "bg-transparent text-(--ink-3) border-[rgba(var(--ink-rgb),0.18)]",
        className,
      )}
      style={active ? { background: color, borderColor: color } : undefined}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full shrink-0"
        style={{ background: active ? "var(--yellow)" : color }}
      />
      <span className="truncate">{name}</span>
      {isPrivate && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Só você vê"
          className="shrink-0 opacity-80"
        >
          <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
          <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
        </svg>
      )}
      {children}
    </span>
  );
}
