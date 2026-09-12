import type { Metadata } from "next";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import * as v from "valibot";
import { readSessionUser } from "@/features/auth/server/auth-session.server";
import { NutritionView } from "@/features/nutrition/components/nutrition-view";
import { getNutritionEntries } from "@/features/nutrition/queries";
import { readCursorHistory } from "@/lib/cursor-navigation";
import { localDateInTimeZone } from "@/lib/local-date";
import { LocalDateSchema } from "@/lib/schemas/maya.schema";

export const metadata: Metadata = { title: "Nutrición" };

async function NutritionContent({ searchParams }: PageProps<"/nutrition">) {
  const user = await readSessionUser();
  if (!user) redirect("/login");
  const search = await searchParams;
  const requested = search.date;
  const cursor = readCursorHistory(search.cursor).at(-1);
  await io();
  const today = localDateInTimeZone(user.timezone);
  const date =
    typeof requested === "string" &&
    v.safeParse(LocalDateSchema, requested).success &&
    requested <= today
      ? requested
      : today;
  const page = await getNutritionEntries(date, cursor);
  return (
    <NutritionView
      date={date}
      today={today}
      entries={page.items}
      nextCursor={page.nextCursor}
    />
  );
}

export default function NutritionPage(props: PageProps<"/nutrition">) {
  return <NutritionContent {...props} />;
}
