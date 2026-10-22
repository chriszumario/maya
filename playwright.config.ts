import { defineConfig, devices } from "@playwright/test";

const port = 4011;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node tests/support/api-server.mjs",
      url: "http://127.0.0.1:4012/health",
      reuseExistingServer: false,
    },
    {
      command: `bun run start --hostname 127.0.0.1 --port ${port}`,
      url: `${baseURL}/pending-approval`,
      reuseExistingServer: false,
      env: {
        API_URL: "http://127.0.0.1:4012",
        SESSION_SECRET: "maya-e2e-only-secret-never-use-in-production-2026",
      },
      timeout: 30_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
  ],
});
