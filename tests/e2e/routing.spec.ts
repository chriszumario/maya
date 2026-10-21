import { expect, test } from "@playwright/test";

test("redirects private routes to login and preserves the destination", async ({
  page,
}) => {
  await page.goto("/goals?status=completed");

  await expect(page).toHaveURL("/login?redirect=%2Fgoals%3Fstatus%3Dcompleted");
  await expect(
    page.getByRole("heading", { level: 2, name: "Bienvenido de nuevo" }),
  ).toBeVisible();
});

test("does not clear a session through a GET request", async ({ request }) => {
  const response = await request.get("/auth/session-expired");
  expect(response.status()).toBe(200);
  expect(response.headers()["set-cookie"]).toBeUndefined();
});

test("sets security headers on public pages", async ({ request }) => {
  const response = await request.get("/pending-approval");

  expect(response.status()).toBe(200);
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
});
