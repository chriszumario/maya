import { LoadingHeader, PageLoading } from "@/components/shared/page-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPendingLoading() {
  return (
    <PageLoading label="las aprobaciones">
      <LoadingHeader />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {["one", "two", "three", "four"].map((key) => (
            <div key={key} className="rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageLoading>
  );
}
