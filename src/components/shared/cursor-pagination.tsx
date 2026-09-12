"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { buildCursorHref, readCursorHistory } from "@/lib/cursor-navigation";

export function CursorPagination({
  nextCursor,
}: {
  nextCursor: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const hasPrevious =
    readCursorHistory(searchParams.getAll("cursor")).length > 0;

  if (!hasPrevious && !nextCursor) return null;

  return (
    <nav
      aria-label="Paginación"
      className="mt-5 flex items-center justify-between gap-3"
    >
      {hasPrevious ? (
        <Link
          href={buildCursorHref(pathname, query, "previous") as Route}
          className={buttonVariants({ variant: "outline" })}
        >
          <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
          Anterior
        </Link>
      ) : (
        <span />
      )}
      {nextCursor ? (
        <Link
          href={buildCursorHref(pathname, query, "next", nextCursor) as Route}
          className={buttonVariants({ variant: "outline" })}
        >
          Siguiente
          <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
