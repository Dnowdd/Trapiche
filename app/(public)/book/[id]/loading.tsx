import { Skeleton } from "@/components/shared/skeleton";

export default function Loading() {
  return (
    <div className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden">
      <div className="pt-7 md:pt-10 px-4 sm:px-8 lg:px-18.75 pb-12 md:pb-15">
        <Skeleton className="hidden md:block h-3 w-72 mb-7" />
        <div className="grid gap-8 md:grid-cols-[260px_1fr] lg:gap-12">
          <Skeleton className="w-45 md:w-full aspect-2/3 rounded mx-auto md:mx-0" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2.5 mt-3">
              <Skeleton className="h-10 w-32 rounded-[10px]" />
              <Skeleton className="h-10 w-32 rounded-[10px]" />
            </div>
            <div className="flex flex-col gap-2.5 mt-6">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
