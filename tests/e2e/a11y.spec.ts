import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { BOOK, signUp } from "./helpers";

async function audit(page: import("@playwright/test").Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .disableRules(["region"])
    .analyze();
  return violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

for (const path of ["/", "/auth", "/privacidade", `/book/${BOOK}`])
  test(`${path} has no accessibility violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    expect(await audit(page)).toEqual([]);
  });

test("signed-in screens have no accessibility violations", async ({ page }) => {
  const user = await signUp(page);
  for (const path of [
    "/",
    `/u/${user.handle}`,
    `/u/${user.handle}?tab=estante`,
    `/u/${user.handle}?tab=citacoes`,
    "/importar",
    "/suporte",
  ]) {
    await page.goto(path, { waitUntil: "networkidle" });
    expect(await audit(page), path).toEqual([]);
  }
});
