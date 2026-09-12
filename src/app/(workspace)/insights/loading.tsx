import { LoadingHeader, PageLoading } from "@/components/shared/page-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InsightsLoading() {
  return (
    <PageLoading label="tus insights">
      <LoadingHeader action />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["focus", "consistency", "energy", "progress"].map((key) => (
          <Card key={key}>
            <CardHeader className="gap-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Card className="min-h-96">
          <CardHeader>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className="min-h-96">
          <CardHeader>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-full max-w-xs" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </PageLoading>
  );
}
