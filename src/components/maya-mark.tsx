import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function MayaMark({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center text-primary",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="size-full bg-current mask-[url('/maya-mark.svg')] mask-contain mask-center mask-no-repeat"
      />
    </span>
  );
}
