export default function Stars({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`text-(--ink-2) tracking-[-1px] ${className}`}
      aria-label={`${value.toFixed(1)} de 5 estrelas`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          aria-hidden
          className={i < Math.round(value) ? "" : "text-[rgba(67,62,18,0.18)]"}
        >
          ★
        </span>
      ))}
    </div>
  );
}
