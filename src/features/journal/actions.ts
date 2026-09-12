"use server";

import { updateTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import * as operations from "./server";

async function mutate<T extends { ok: boolean }>(operation: () => Promise<T>) {
  const result = await operation();
  if (result.ok) {
    updateTag(cacheTags.journal);
    updateTag(cacheTags.dashboard);
    updateTag(cacheTags.trends);
  }
  return result;
}

export async function createJournalEntryFn(
  input: Parameters<typeof operations.createJournalEntryFn>[0],
) {
  return mutate(() => operations.createJournalEntryFn(input));
}
export async function updateJournalEntryFn(
  input: Parameters<typeof operations.updateJournalEntryFn>[0],
) {
  return mutate(() => operations.updateJournalEntryFn(input));
}
export async function deleteJournalEntryFn(
  input: Parameters<typeof operations.deleteJournalEntryFn>[0],
) {
  return mutate(() => operations.deleteJournalEntryFn(input));
}
export async function improveJournalFieldFn(
  input: Parameters<typeof operations.improveJournalFieldFn>[0],
) {
  return operations.improveJournalFieldFn(input);
}
