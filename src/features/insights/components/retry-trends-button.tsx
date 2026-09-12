"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function RetryTrendsButton() {
  const router = useRouter();
  return (
    <Button size="sm" variant="outline" onClick={() => router.refresh()}>
      Intentar nuevamente
    </Button>
  );
}
