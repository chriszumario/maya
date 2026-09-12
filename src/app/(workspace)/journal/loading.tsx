import { LoadingHeader, PageLoading } from "@/components/shared/page-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function JournalLoading() {
  return (
    <PageLoading label="tu diario">
      <LoadingHeader action />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-10" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <Card className="min-h-96">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-11 w-32" />
          </CardContent>
        </Card>
        <Card className="min-h-64">
          <CardHeader>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-full max-w-xs" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    </PageLoading>
  );
}
