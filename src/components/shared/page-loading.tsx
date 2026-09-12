import { Skeleton } from "@/components/ui/skeleton";

const loadingRowKeys = ["one", "two", "three", "four", "five", "six"];

export function PageLoading({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-busy="true"
      aria-label={`Cargando ${label}`}
      aria-live="polite"
      className="flex flex-col gap-6"
      role="status"
    >
      <span className="sr-only">Cargando {label}...</span>
      <div aria-hidden="true" className="flex flex-col gap-6">
        {children}
      </div>
    </section>
  );
}

export function LoadingHeader({
  action = false,
  titleWidth = "w-72",
}: {
  action?: boolean;
  titleWidth?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className={`h-10 max-w-full ${titleWidth}`} />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      {action ? <Skeleton className="h-10 w-32 shrink-0" /> : null}
    </div>
  );
}

export function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col divide-y">
      {loadingRowKeys.slice(0, count).map((key) => (
        <div key={key} className="flex items-center gap-3 py-4">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}
