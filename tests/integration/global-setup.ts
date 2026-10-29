import { execSync } from "node:child_process";
import { TEST_DATABASE_URL, assertLocal } from "./env";

export default function setup() {
  assertLocal(TEST_DATABASE_URL);
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      DIRECT_URL: TEST_DATABASE_URL,
    },
  });
}
