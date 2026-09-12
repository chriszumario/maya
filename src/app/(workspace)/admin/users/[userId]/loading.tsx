import {
  LoadingHeader,
  LoadingRows,
  PageLoading,
} from "@/components/shared/page-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUserDetailLoading() {
  return (
    <PageLoading label="el usuario">
      <Skeleton className="h-9 w-36" />
      <LoadingHeader />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </CardHeader>
          <CardContent>
            <LoadingRows count={3} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </CardHeader>
          <CardContent>
            <LoadingRows count={3} />
          </CardContent>
        </Card>
      </div>
    </PageLoading>
  );
}
