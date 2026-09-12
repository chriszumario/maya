import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { getJournalEntriesFn } from "./server";

export async function getJournalEntries(cursor?: string) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.journal);
  const result = await getJournalEntriesFn({
    data: { limit: 100, cursor },
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
