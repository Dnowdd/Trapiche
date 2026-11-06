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

test.describe("dark theme", () => {
  test.use({ colorScheme: "dark" });
  for (const path of ["/", "/auth", `/book/${BOOK}`])
    test(`${path} has no accessibility violations in dark mode`, async ({
      page,
    }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      expect(await audit(page)).toEqual([]);
    });
});

for (const scheme of ["light", "dark"] as const)
  test.describe(`assistant in ${scheme} mode`, () => {
    test.use({ colorScheme: scheme, reducedMotion: "reduce" });
    test("panel and page have no accessibility violations", async ({
      page,
    }) => {
      await signUp(page);
      await page.goto(`/book/${BOOK}`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /Pergunte ao Prático/ }).click();
      const panel = page.getByRole("dialog", { name: /Prático/ });
      await expect(panel.getByText(/Oi, Leitora/)).toBeVisible();
      expect(await audit(page), "empty panel").toEqual([]);
      await panel
        .getByRole("button", { name: "Colocar na minha pilha" })
        .click();
      await expect(
        panel.getByRole("button", { name: "Confirmar" }),
      ).toBeEnabled();
      expect(await audit(page), "proposal").toEqual([]);
      await panel.getByRole("button", { name: "Confirmar" }).click();
      await panel
        .getByRole("checkbox", { name: "Usar os dados da minha conta" })
        .check();
      await panel.getByLabel("Mensagem para o Prático").fill("Minha estante");
      await panel.getByLabel("Mensagem para o Prático").press("Enter");
      await expect(
        panel.getByText("Quer que eu sugira o próximo?"),
      ).toBeVisible();
      expect(await audit(page), "books").toEqual([]);
      await page.goto("/assistente", { waitUntil: "networkidle" });
      await page
        .getByRole("navigation", { name: "Conversas" })
        .getByRole("button", {
          name: "Coloca este livro no meu Quero ler.",
          exact: true,
        })
        .click();
      await expect(
        page.getByText("Quer que eu sugira o próximo?"),
      ).toBeVisible();
      expect(await audit(page), "page").toEqual([]);
    });
  });
