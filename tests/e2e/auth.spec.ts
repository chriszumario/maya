import { expect, test } from "@playwright/test";

test("navigates between the public authentication pages", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { level: 2, name: "Bienvenido de nuevo" }),
  ).toBeVisible();
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  await expect(page.getByLabel("Contraseña")).toBeVisible();

  await page.getByRole("link", { name: "Registrarme" }).click();

  await expect(page).toHaveURL("/register");
  await expect(
    page.getByRole("heading", { level: 2, name: "Crea tu cuenta" }),
  ).toBeVisible();
});

test("shows client-side registration errors", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Solicitar acceso" }).click();

  await expect(
    page.getByText("El nombre debe tener al menos 2 caracteres."),
  ).toBeVisible();
  await expect(page.getByText("Ingresa tu correo electrónico.")).toBeVisible();
  await expect(
    page.getByText("La contraseña debe tener al menos 12 caracteres."),
  ).toBeVisible();
});

test("renders the pending approval Server Component", async ({ page }) => {
  await page.goto("/pending-approval");

  await expect(
    page.getByRole("heading", { level: 1, name: "Solicitud recibida" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Volver al inicio de sesión" }),
  ).toHaveAttribute("href", "/login");
});
