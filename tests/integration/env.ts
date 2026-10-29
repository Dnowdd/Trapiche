export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:test@localhost:54329/trapiche_test";

export function assertLocal(url: string) {
  const host = new URL(url).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host))
    throw new Error(
      `Integration tests only run against a local database, got host "${host}".`,
    );
}
