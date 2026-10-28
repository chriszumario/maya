import "server-only";

import { cacheLife } from "next/cache";
import { cookies } from "next/headers";
import {
  type AppSessionData,
  decodeSession,
  encodeSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "./session-codec";

export async function getAppSession() {
  const cookieStore = await cookies();
  let data = decodeSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  return {
    get data() {
      return data;
    },
    async update(patch: AppSessionData) {
      data = { ...data, ...patch };
      cookieStore.set(
        SESSION_COOKIE_NAME,
        encodeSession(data),
        sessionCookieOptions,
      );
    },
    async clear() {
      data = {};
      cookieStore.delete(SESSION_COOKIE_NAME);
    },
  };
}

export async function readSessionUser() {
  "use cache: private";
  cacheLife({ stale: 30 });
  return (await getAppSession()).data.user ?? null;
}
