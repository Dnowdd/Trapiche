import { CoverGridSkeleton, Skeleton } from "@/components/shared/skeleton";
import type { Tab } from "@/lib/queries/profile";

function CardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[18px] p-5 sm:p-6 sm:px-7">
      <Skeleton className="h-2.5 w-24 mb-2" />
      <Skeleton className="h-4 w-44 mb-5" />
      {children}
    </div>
  );
}

function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3.5 items-center">
          <Skeleton className="w-7.5 h-11 rounded-sm shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChipsSkeleton() {
  return (
    <div className="flex gap-2 mb-5.5">
      {[64, 58, 80, 70, 96].map((w, i) => (
        <Skeleton key={i} className="h-8 rounded-full" style={{ width: w }} />
      ))}
    </div>
  );
}

export function TabSkeleton({ tab }: { tab: Tab }) {
  switch (tab) {
    case "inicio":
      return (
        <div className="grid gap-5.5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-5.5">
            <CardSkeleton>
              <CoverGridSkeleton
                count={5}
                className="grid-cols-3 sm:grid-cols-5"
              />
            </CardSkeleton>
            <CardSkeleton>
              <RowsSkeleton />
            </CardSkeleton>
          </div>
          <div className="flex flex-col gap-5.5">
            <CardSkeleton>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </CardSkeleton>
            <CardSkeleton>
              <RowsSkeleton rows={3} />
            </CardSkeleton>
          </div>
        </div>
      );
    case "estante":
    case "curtidas":
      return (
        <>
          <ChipsSkeleton />
          <CoverGridSkeleton />
        </>
      );
    default:
      return (
        <>
          <ChipsSkeleton />
          <CardSkeleton>
            <RowsSkeleton rows={6} />
          </CardSkeleton>
        </>
      );
  }
}

export function ProfileSkeleton() {
  return (
    <div className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden">
      <div className="pt-8 md:pt-10 px-4 sm:px-8 lg:px-15 pb-8 flex flex-col gap-7">
        <div className="flex gap-5 sm:gap-7 items-center">
          <Skeleton className="w-20 h-20 sm:w-28 sm:h-28 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-3">
            <Skeleton className="h-8 w-56 max-w-full" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="px-4 sm:px-8 lg:px-15 border-y border-[rgba(67,62,18,0.12)] py-4 flex gap-8">
        {[52, 60, 52, 80, 52, 64].map((w, i) => (
          <Skeleton key={i} className="h-3" style={{ width: w }} />
        ))}
      </div>
      <div className="pt-7 md:pt-9 px-4 sm:px-8 lg:px-15 pb-12">
        <TabSkeleton tab="inicio" />
      </div>
    </div>
  );
}
