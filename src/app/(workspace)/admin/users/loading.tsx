import { LoadingHeader, PageLoading } from "@/components/shared/page-loading";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <PageLoading label="los usuarios">
      <LoadingHeader />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-10 w-full sm:max-w-sm" />
        <Skeleton className="h-10 w-36" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col divide-y">
            {["one", "two", "three", "four", "five", "six"].map((key) => (
              <div key={key} className="flex items-center gap-4 p-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                </div>
                <Skeleton className="hidden h-6 w-20 sm:block" />
                <Skeleton className="size-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageLoading>
  );
}
