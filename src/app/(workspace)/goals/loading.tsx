import { LoadingHeader, PageLoading } from "@/components/shared/page-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function GoalsLoading() {
  return (
    <PageLoading label="tus metas">
      <LoadingHeader action />
      <div className="flex flex-wrap gap-2">
        {["all", "active", "pending", "completed", "cancelled"].map((key) => (
          <Skeleton key={key} className="h-9 w-24" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {["one", "two", "three", "four", "five", "six"].map((key) => (
          <Card key={key} className="min-h-64">
            <CardHeader className="gap-4">
              <div className="flex items-center justify-between">
                <Skeleton className="size-10 rounded-2xl" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLoading>
  );
}
