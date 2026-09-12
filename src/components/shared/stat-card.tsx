import type { ComponentType } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardAction>
          <span className="flex size-9 items-center justify-center rounded-2xl bg-muted text-primary">
            <Icon aria-hidden="true" />
          </span>
        </CardAction>
        <CardTitle className="font-heading text-3xl font-semibold tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
