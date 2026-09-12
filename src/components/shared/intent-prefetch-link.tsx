"use client";

import type { Route } from "next";
import Link from "next/link";
import { type ComponentProps, useState } from "react";

type IntentPrefetchLinkProps<T extends string> = Omit<
  ComponentProps<typeof Link>,
  "href" | "prefetch"
> & { href: Route<T> };

export function IntentPrefetchLink<T extends string>({
  href,
  onFocus,
  onMouseEnter,
  ...props
}: IntentPrefetchLinkProps<T>) {
  const [hasIntent, setHasIntent] = useState(false);

  return (
    <Link
      {...props}
      href={href}
      prefetch={hasIntent}
      onFocus={(event) => {
        setHasIntent(true);
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        setHasIntent(true);
        onMouseEnter?.(event);
      }}
    />
  );
}
