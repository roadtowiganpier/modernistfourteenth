import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { NOMINATIM_STUB_PORT } from "./e2e/fixtures/nominatim-stub";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const definedEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] => entry[1] !== undefined
  )
);

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "line",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...definedEnv,
      // Mirrors vitest.setup.ts's DATABASE_URL swap (see TESTING.md → Test
      // database) so local E2E runs never write to the real dev database.
      ...(process.env.DATABASE_URL_TEST
        ? { DATABASE_URL: process.env.DATABASE_URL_TEST }
        : {}),
      // Real Nominatim must never be called in tests — point the app's
      // server-side geocode fetch at the local stub started in global-setup.ts.
      NOMINATIM_URL: `http://127.0.0.1:${NOMINATIM_STUB_PORT}`,
    },
  },
});
