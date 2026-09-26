import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke pass — hermetic by design: tests intercept every API call
 * (see e2e/smoke.spec.ts), so no backend is required locally or in CI.
 * Uses the system Chrome (channel: "chrome") to avoid a browser download.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    channel: "chrome",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
