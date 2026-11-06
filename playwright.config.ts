import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const MOCK_OPENAI_PORT = Number(process.env.MOCK_OPENAI_PORT ?? 4010);
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
  webServer: [
    {
      command: "node tests/e2e/mock-openai.mjs",
      url: `http://127.0.0.1:${MOCK_OPENAI_PORT}/health`,
      reuseExistingServer: true,
      env: { MOCK_OPENAI_PORT: String(MOCK_OPENAI_PORT) },
    },
    {
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
        OPENAI_API_KEY: "e2e-mock-key",
        OPENAI_BASE_URL: `http://127.0.0.1:${MOCK_OPENAI_PORT}/v1`,
      },
    },
  ],
});
