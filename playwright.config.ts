import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // Auth setup runs first — produces storageState for authenticated tests
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: [/.*\.setup\.ts/, /perf-regression\.spec\.ts/, /scroll-regression\.spec\.ts/],
    },
    // Unauthenticated, no dev server, targets a DEPLOYED origin:
    //   PERF_BASE_URL=https://staging.ailinc.com npx playwright test --project=perf
    {
      name: "perf",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /(perf|scroll)-regression\.spec\.ts/,
    },
    {
      name: "chromium-unauth",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /.*\/(auth)\/.+\.spec\.ts/,
    },
  ],
  // PERF_BASE_URL targets a DEPLOYED origin (e2e/perf-regression.spec.ts) —
  // no local dev server needed or wanted in that mode.
  ...(process.env.PERF_BASE_URL
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
