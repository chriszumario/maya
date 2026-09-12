import { LoadingHeader, PageLoading } from "@/components/shared/page-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <PageLoading label="el resumen de hoy">
      <LoadingHeader />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["goals", "tasks", "journal", "nutrition"].map((key) => (
          <Card key={key}>
            <CardHeader className="gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <Card className="min-h-80">
          <CardHeader>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card className="min-h-80">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full max-w-xs" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </PageLoading>
  );
}
