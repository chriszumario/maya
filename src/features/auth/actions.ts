"use server";

import { redirect } from "next/navigation";
import { loginFn, logoutFn, registerFn } from "./server/auth";

export async function loginAction(input: Parameters<typeof loginFn>[0]) {
  return loginFn(input);
}

export async function registerAction(input: Parameters<typeof registerFn>[0]) {
  return registerFn(input);
}

export async function logoutAction() {
  await logoutFn();
  redirect("/login");
}
