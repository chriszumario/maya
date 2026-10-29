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

test("toggles profile and security passwords independently", async ({
  page,
}) => {
  const profilePassword = page.getByLabel("Contraseña actual", { exact: true });
  await profilePassword.fill("test-password-12345");
  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(profilePassword).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar contraseña" }).click();
  await expect(profilePassword).toHaveAttribute("type", "password");

  await page.getByRole("tab", { name: "Seguridad" }).click();
  for (const label of [
    "Contraseña actual",
    "Nueva contraseña",
    "Confirmar contraseña",
  ]) {
    const password = page.getByLabel(label, { exact: true });
    await password.fill("test-password-12345");
    const group = page
      .locator('[data-slot="input-group"]')
      .filter({ has: password });
    await group.getByRole("button", { name: "Mostrar contraseña" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("test-password-12345");
    await expect(page.locator('input[type="password"]:visible')).toHaveCount(2);
    await group.getByRole("button", { name: "Ocultar contraseña" }).click();
    await expect(password).toHaveAttribute("type", "password");
  }
  await expect(page).toHaveURL("/settings");
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

test("creates, edits and deletes food using labeled controls and keyboard selection", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/nutrition");
  await page
    .getByRole("button", { name: "Registrar alimento" })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  const meal = dialog.getByRole("combobox", { name: "Tipo de comida" });
  await meal.focus();
  await page.keyboard.press("ArrowDown");
  await page
    .getByRole("option", { name: "Desayuno", exact: true })
    .press("Enter");
  await dialog.getByLabel("Alimento o preparación").fill("Avena de prueba");
  await dialog.getByLabel("Cantidad").fill("100");
  await dialog.getByLabel("Unidad", { exact: true }).fill("g");
  await dialog.getByLabel("Calorías", { exact: true }).fill("250");
  await dialog.getByRole("button", { name: "Guardar alimento" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Avena de prueba" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Editar Avena de prueba" }).click();
  await dialog.getByLabel("Calorías", { exact: true }).fill("275");
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("275 kcal en esta página")).toBeVisible();

  await page.getByRole("button", { name: "Eliminar Avena de prueba" }).click();
  const confirmation = page.getByRole("alertdialog");
  await confirmation.getByRole("button", { name: "Cancelar" }).click();
  await expect(
    page.getByRole("heading", { name: "Avena de prueba" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Eliminar Avena de prueba" }).click();
  await confirmation
    .getByRole("button", { name: "Eliminar", exact: true })
    .click();
  await expect(page.getByText("No hay alimentos registrados")).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("associates validation messages with profile inputs and prevents indexing", async ({
  page,
}) => {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  const timezone = page.getByLabel("Zona horaria");
  await timezone.fill("Invalid/Timezone");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(timezone).toHaveAttribute("aria-invalid", "true");
  await expect(timezone).toHaveAccessibleDescription(
    /La zona horaria no es válida/,
  );
  await expect(timezone).toHaveValue("Invalid/Timezone");
});

test("uses not-found for a goal missing from the API", async ({ page }) => {
  await page.goto("/goals/999");
  await expect(page.getByText("No encontramos este contenido")).toBeVisible();
  await expect(
    page.getByText("No pudimos cargar esta sección"),
  ).not.toBeVisible();
});

test("logs out and protects subsequent workspace navigation", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Abrir menú de Usuario de prueba" })
    .click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL("/login");
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login\?redirect=/);
});

test("redirects an authenticated user away from login", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("button", { name: "Iniciar sesión" }),
  ).not.toBeVisible();
});

test("completes and reopens an agenda task and retains its state after reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/today");
  await page
    .getByRole("button", { name: "Marcar Leer un capítulo como completada" })
    .click();
  const reopen = page.getByRole("button", { name: "Reabrir Leer un capítulo" });
  await expect(reopen).toBeEnabled();
  await page.reload();
  await expect(reopen).toBeVisible();
  await reopen.click();
  await expect(page.getByText("En curso", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("En curso", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
