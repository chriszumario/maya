import { LoadingHeader, PageLoading } from "@/components/shared/page-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <PageLoading label="la administración">
      <LoadingHeader />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["users", "goals", "tasks", "activity"].map((key) => (
          <Card key={key}>
            <CardHeader className="gap-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {["activity", "system"].map((key) => (
          <Card key={key} className="min-h-72">
            <CardHeader>
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-full max-w-sm" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLoading>
  );
}
