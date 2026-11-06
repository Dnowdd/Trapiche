import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://postgres:test@localhost:54329/trapiche_dev";

if (!["localhost", "127.0.0.1"].includes(new URL(DATABASE_URL).hostname))
  throw new Error("E2E tests only run against a local database.");

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "pt-BR",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /public\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}/robots.txt`,
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      DATABASE_URL,
      DIRECT_URL: DATABASE_URL,
      NEXT_DIST_DIR: ".next-local",
      RESEND_API_KEY: "",
      SKIP_EMAIL_VERIFICATION: "true",
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
      NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
    },
  },
});
