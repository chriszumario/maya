import { LoadingHeader, PageLoading } from "@/components/shared/page-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NutritionLoading() {
  return (
    <PageLoading label="tu nutrición">
      <LoadingHeader action />
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-10 w-10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {["calories", "protein", "water"].map((key) => (
          <Card key={key}>
            <CardHeader className="gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {["breakfast", "lunch", "snack", "dinner"].map((key) => (
            <Skeleton key={key} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    </PageLoading>
  );
}
