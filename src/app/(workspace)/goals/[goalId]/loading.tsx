import {
  LoadingHeader,
  LoadingRows,
  PageLoading,
} from "@/components/shared/page-loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function GoalDetailLoading() {
  return (
    <PageLoading label="el detalle de la meta">
      <Skeleton className="h-9 w-36" />
      <LoadingHeader action titleWidth="w-96" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div className="rounded-3xl border p-6">
          <div className="mb-5 flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
          <LoadingRows count={4} />
        </div>
        <div className="rounded-3xl border p-6">
          <Skeleton className="mb-5 h-6 w-32" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </PageLoading>
  );
}
