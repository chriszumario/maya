import {
  LoadingHeader,
  LoadingRows,
  PageLoading,
} from "@/components/shared/page-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TodayLoading() {
  return (
    <PageLoading label="tu día">
      <LoadingHeader />
      <div className="grid gap-4 sm:grid-cols-3">
        {["planned", "completed", "minutes"].map((key) => (
          <Card key={key}>
            <CardHeader className="gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </CardHeader>
          <CardContent>
            <LoadingRows count={4} />
          </CardContent>
        </Card>
        <Card className="min-h-64">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full max-w-xs" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </PageLoading>
  );
}
