import { cn } from "@/lib/utils";

export function fmtRating(n: number) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function starFill(value: number, index: number) {
  const fill = Math.max(0, Math.min(1, value - index));
  return fill >= 0.75 ? 100 : fill >= 0.25 ? 50 : 0;
}

export function Star({
  fill,
  emptyClassName = "text-[rgba(67,62,18,0.18)]",
}: {
  fill: number;
  emptyClassName?: string;
}) {
  return (
    <span aria-hidden className="relative inline-block">
      <span className={emptyClassName}>★</span>
      {fill > 0 && (
        <span
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${fill}%` }}
        >
          ★
        </span>
      )}
    </span>
  );
}

export default function Stars({
  value,
  className,
  emptyClassName,
}: {
  value: number;
  className?: string;
  emptyClassName?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`${fmtRating(value)} de 5 estrelas`}
      className={cn(
        "inline-flex leading-none text-(--ink-2) tracking-[-1px]",
        className,
      )}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          fill={starFill(value, i)}
          emptyClassName={emptyClassName}
        />
      ))}
    </span>
  );
}
