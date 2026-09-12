import type { Metadata } from "next";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import { readSessionUser } from "@/features/auth/server/auth-session.server";
import { JournalView } from "@/features/journal/components/journal-view";
import { getJournalEntries } from "@/features/journal/queries";
import { readCursorHistory } from "@/lib/cursor-navigation";
import { localDateInTimeZone } from "@/lib/local-date";

export const metadata: Metadata = { title: "Diario" };

async function JournalContent({ searchParams }: PageProps<"/journal">) {
  const user = await readSessionUser();
  if (!user) redirect("/login");
  const cursor = readCursorHistory((await searchParams).cursor).at(-1);
  const page = await getJournalEntries(cursor);
  await io();
  return (
    <JournalView
      key={cursor ?? "first"}
      today={localDateInTimeZone(user.timezone)}
      entries={page.items}
      nextCursor={page.nextCursor}
    />
  );
}

export default function JournalPage(props: PageProps<"/journal">) {
  return <JournalContent {...props} />;
}
