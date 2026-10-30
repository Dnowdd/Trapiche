import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn(
        "rounded-md bg-[rgba(67,62,18,0.07)] relative overflow-hidden",
        "after:content-[''] after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.4s_ease-in-out_infinite]",
        "after:bg-[linear-gradient(90deg,transparent,rgba(255,253,223,0.7),transparent)]",
        className,
      )}
    />
  );
}

export function CoverGridSkeleton({
  count = 12,
  className = "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:gap-4.5 gap-y-6", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="w-full aspect-2/3 rounded" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function PageSpinner({ label = "Carregando" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center py-32">
      <div className="loader" aria-hidden />
      <span className="sr-only">{label}…</span>
    </div>
  );
}
