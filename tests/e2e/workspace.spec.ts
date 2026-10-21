import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login?redirect=%2Fsettings");
  await page.getByLabel("Correo electrónico").fill("e2e@example.com");
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("test-password-12345");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/settings");
  await expect(
    page.getByRole("heading", { name: "Cuenta y seguridad" }),
  ).toBeVisible();
});

test("confirms a saved profile and shows an API error without losing navigation", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Perfil guardado correctamente." }),
  ).toBeVisible();
  await page.goto("/insights");
  await expect(page.getByText("No pudimos cargar esta sección")).toBeVisible();
  await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
});

test("navigates with an authenticated session and closes the mobile drawer", async ({
  page,
}) => {
  const menu = page.getByRole("button", { name: "Abrir menú", exact: true });
  if (await menu.isVisible()) {
    await menu.click();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Nutrición" })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  } else {
    await page.getByRole("link", { name: "Nutrición", exact: true }).click();
  }
  await expect(page.getByText("No hay alimentos registrados")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("keeps the nutrition form usable in a short viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 450 });
  await page.goto("/nutrition");
  await page
    .getByRole("button", { name: /registrar|añadir|agregar/i })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.y).toBeGreaterThanOrEqual(0);
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(450);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
