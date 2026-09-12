import { CompassIcon } from "lucide-react";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function MayaMark({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "brand-mark flex size-10 shrink-0 items-center justify-center rounded-full",
        className,
      )}
      {...props}
    >
      <CompassIcon aria-hidden="true" className="size-5" strokeWidth={1.8} />
    </span>
  );
}
