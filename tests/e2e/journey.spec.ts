import { expect, test } from "@playwright/test";
import { BOOK, signUp, uniqueUser } from "./helpers";

test("sign up through the form and land on the dashboard", async ({ page }) => {
  const user = uniqueUser("form");
  await page.goto("/auth?mode=register");
  await page.getByPlaceholder("Como te chamam").fill(user.name);
  await page.getByPlaceholder("seu_user").fill(user.handle);
  await page.getByPlaceholder("voce@email.com").fill(user.email);
  await page.getByPlaceholder("Crie uma senha forte").fill(user.password);
  await page.getByText("Li e aceito os").click();
  await page.getByRole("button", { name: /Criar minha conta/ }).click();
  await expect(page.getByText("Deixe o Trapiche com a sua cara")).toBeVisible();
  await expect(page.getByRole("link", { name: /Importe/ })).toHaveAttribute(
    "href",
    "/importar",
  );
});

test("shelve a book, tag it and save a quote", async ({ page }) => {
  const user = await signUp(page);
  await page.goto(`/book/${BOOK}`);
  await page.getByRole("button", { name: "Quero ler", exact: true }).click();
  await expect(page.getByText("Suas tags")).toBeVisible();

  await page.getByRole("button", { name: "Adicionar tag" }).click();
  await page.getByPlaceholder("Buscar ou criar tag…").fill("clube do livro");
  await page.getByPlaceholder("Buscar ou criar tag…").press("Enter");
  await expect(
    page.getByRole("button", { name: "Tirar a tag clube do livro" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  const quote = `Viver é muito perigoso ${Date.now()}`;
  await page
    .getByRole("button", { name: /Guardar citação|Nenhuma citação/ })
    .first()
    .click();
  await page.getByPlaceholder("“Viver é muito perigoso.”").fill(quote);
  await page.getByRole("button", { name: "Guardar citação" }).last().click();
  await expect(page.getByText(quote)).toBeVisible();

  await page.goto(`/u/${user.handle}?tab=citacoes`);
  await expect(page.getByText(quote)).toBeVisible();
  await page.goto(`/u/${user.handle}?tab=estante&status=WANT`);
  await expect(
    page.getByRole("button", { name: /clube do livro/ }),
  ).toBeVisible();
});

test("a private profile is hidden from visitors", async ({ page, browser }) => {
  const user = await signUp(page);
  await page.goto(`/u/${user.handle}?editar=privacidade`);
  await page.getByRole("radio", { name: /Só eu/ }).click();
  await page.getByRole("button", { name: "Salvar privacidade" }).click();
  await expect(page.getByText("Privacidade atualizada.")).toBeVisible();

  await page.goto(`/u/${user.handle}?visitante=1`);
  await expect(page.getByText("Perfil privado")).toBeVisible();

  const visitor = await browser.newContext();
  const anon = await visitor.newPage();
  await anon.goto(`/u/${user.handle}`);
  await expect(anon.getByText("Perfil privado")).toBeVisible();
  await expect(anon.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await visitor.close();
});

test("import previews a Goodreads export", async ({ page }) => {
  await signUp(page);
  await page.goto("/importar");
  const csv = [
    "Title,Author,ISBN13,My Rating,Date Read,Bookshelves,Exclusive Shelf",
    'Grande Sertão: Veredas,João Guimarães Rosa,"=""9788535908770""",5,2024/03/10,"clássicos, read",read',
    "Torto Arado,Itamar Vieira Junior,,0,,to-read,to-read",
  ].join("\n");
  await page.locator('input[type="file"]').setInputFiles({
    name: "goodreads_library_export.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await expect(
    page.getByText("Detectamos um arquivo do Goodreads"),
  ).toBeVisible();
  await expect(page.getByText("2 livros prontos para importar")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Importar 2 livros" }),
  ).toBeVisible();
});
