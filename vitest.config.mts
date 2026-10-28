import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "server-only": resolve("tests/server-only.ts"),
    },
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    // Bound concurrent DOM/coverage workers to avoid CPU contention and false timeouts.
    maxWorkers: 2,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/features/**/actions.ts",
        "src/features/**/model/**/*.ts",
        "src/features/**/schemas.ts",
        "src/features/**/schemas/**/*.ts",
        "src/features/**/server.ts",
        "src/features/**/server/**/*.ts",
        "src/hooks/**/*.ts",
        "src/lib/**/*.ts",
        "src/proxy.ts",
      ],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 35,
        lines: 50,
      },
    },
  },
});
