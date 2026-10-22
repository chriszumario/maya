"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { getAppSession } from "@/features/auth/server/auth-session.server";
import { cacheTags } from "@/lib/cache-tags";
import { updatePasswordFn, updateProfileFn } from "./server";

export async function updateProfileAction(
  input: Parameters<typeof updateProfileFn>[0],
) {
  const result = await updateProfileFn(input);
  if (result.ok) {
    updateTag(cacheTags.dashboard);
    updateTag(cacheTags.today);
    updateTag(cacheTags.insights);
    updateTag(cacheTags.trends);
    updateTag(cacheTags.nutrition);
    updateTag(cacheTags.journal);
  }
  return result;
}

export async function updatePasswordAction(
  input: Parameters<typeof updatePasswordFn>[0],
) {
  const result = await updatePasswordFn(input);
  if (!result.ok) return result;

  await (await getAppSession()).clear();
  redirect("/login");
}
