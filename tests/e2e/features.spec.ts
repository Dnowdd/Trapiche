import { expect, test } from "@playwright/test";
import pg from "pg";
import { BOOK, signUp } from "./helpers";

const DB =
  process.env.E2E_DATABASE_URL ??
  "postgresql://postgres:test@localhost:54329/trapiche_dev";

async function sql(query: string, values: unknown[] = []) {
  const client = new pg.Client({ connectionString: DB });
  await client.connect();
  try {
    return (await client.query(query, values)).rows;
  } finally {
    await client.end();
  }
}

test("email preferences save and persist", async ({ page }) => {
  const user = await signUp(page);
  await page.goto(`/u/${user.handle}?editar=emails`);
  await page.getByText("Resumo do mês").click();
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Preferências de e-mail salvas.")).toBeVisible();
  const [row] = await sql(
    `select "monthlyDigest", "inactivityReminder" from "User" where handle = $1`,
    [user.handle],
  );
  expect(row).toEqual({ monthlyDigest: true, inactivityReminder: false });
});

test("manage tags from the shelf", async ({ page }) => {
  const user = await signUp(page);
  await page.goto(`/book/${BOOK}`);
  await page.getByRole("button", { name: "Quero ler", exact: true }).click();
  await expect(page.getByText("Suas tags")).toBeVisible();
  await page.goto(`/u/${user.handle}?tab=estante`);
  await page.getByRole("button", { name: "Criar tags" }).click();
  const dialog = page.getByRole("dialog", { name: "Suas tags" });
  await dialog.getByPlaceholder(/Nova tag/).fill("emprestados");
  await dialog.getByRole("button", { name: "Criar" }).click();
  await expect(page.getByText("Tag criada.")).toBeVisible();
  await expect(dialog.getByLabel("Nome da tag")).toHaveValue("emprestados");
  await dialog.getByLabel("Nome da tag").fill("emprestado pra Ana");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Tag salva.")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await dialog.getByRole("button", { name: /Apagar a tag/ }).click();
  await expect(page.getByText("Tag apagada.")).toBeVisible();
});

test("edit and delete a quote", async ({ page }) => {
  await signUp(page);
  await page.goto(`/book/${BOOK}`);
  const text = `Trecho ${Date.now()}`;
  await page
    .getByRole("button", { name: /Guardar citação|Nenhuma citação/ })
    .first()
    .click();
  await page.getByPlaceholder("“Viver é muito perigoso.”").fill(text);
  await page.getByRole("button", { name: "Guardar citação" }).last().click();
  const card = page.locator("figure", { hasText: text });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Editar" }).click();
  await page.getByText("Só para mim").last().click();
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(card.getByText("Só para mim")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await card.getByRole("button", { name: "Apagar" }).click();
  await expect(page.getByText("Citação apagada.")).toBeVisible();
  await expect(card).toHaveCount(0);
});

test("admins place a book in a series", async ({ page }) => {
  const user = await signUp(page);
  await sql(`update "User" set "isAdmin" = true where handle = $1`, [
    user.handle,
  ]);
  const name = `Série E2E ${Date.now()}`;
  await page.goto(`/book/${BOOK}`);
  const existing = page.getByRole("button", { name: "Editar", exact: true });
  if (
    await existing
      .first()
      .isVisible()
      .catch(() => false)
  )
    await existing.first().click();
  else
    await page.getByRole("button", { name: "+ Adicionar a uma série" }).click();
  await page.getByPlaceholder("Ex.: Trilogia da Fundação").fill(name);
  await page.getByPlaceholder("1", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Série salva.")).toBeVisible();
  await expect(page.getByRole("link", { name })).toBeVisible();
  await page.getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
});

test("create a developer key with write access", async ({ page }) => {
  await signUp(page);
  await page.goto("/desenvolvedores");
  await page.getByText("Li e concordo com essas regras.").click();
  await page.getByRole("button", { name: "Ativar acesso" }).click();
  await page
    .getByRole("button", { name: /Nova chave|Criar chave/ })
    .first()
    .click();
  await page.getByRole("dialog").getByRole("textbox").fill("app mobile");
  await page.getByRole("dialog").getByText("Permitir escrita").click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Criar chave" })
    .click();
  await expect(page.getByText(/trp_live_/).first()).toBeVisible();
  await page.getByRole("button", { name: "Pronto" }).click();
  await expect(page.getByText("leitura e escrita")).toBeVisible();
});

test("run an import to the end", async ({ page }) => {
  test.setTimeout(150_000);
  const user = await signUp(page);
  await page.goto("/importar");
  const csv = [
    "Title,Author,ISBN13,My Rating,Date Read,Bookshelves,Exclusive Shelf",
    'Grande sertão,Eduardo de Faria Coutinho,"=""9788580331431""",5,2024/03/10,"clássicos, read",read',
    "Um livro que não existe xyz,Ninguém Nenhum,,0,,to-read,to-read",
  ].join("\n");
  await page.locator('input[type="file"]').setInputFiles({
    name: "goodreads.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await page.getByRole("button", { name: "Importar 2 livros" }).click();
  await expect(page.getByText("Importação concluída")).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByText("Um livro que não existe xyz")).toBeVisible();
  await page.getByRole("link", { name: "Ver minha estante →" }).click();
  await expect(page).toHaveURL(new RegExp(`/u/${user.handle}`));
  await expect(page.getByRole("button", { name: /clássicos/ })).toBeVisible();
});

test("track an e-book by percentage", async ({ page }) => {
  await signUp(page);
  await page.goto(`/book/${BOOK}`);
  await page.getByRole("button", { name: "Outros status de leitura" }).click();
  await page.getByRole("menuitem", { name: "Lendo", exact: true }).click();
  await page.getByRole("button", { name: "Comecei" }).click();
  await expect(page.getByText("Você está aqui agora")).toBeVisible();
  await page.getByRole("radio", { name: "E-book" }).click();
  await expect(page.getByText("Formato: e-book.")).toBeVisible();
  await page.getByRole("button", { name: "Editar progresso" }).click();
  await page.getByLabel("Porcentagem lida").fill("37");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("37% do e-book")).toBeVisible();
});

test("search the shelf and export it as csv", async ({ page }) => {
  const user = await signUp(page);
  await page.goto(`/book/${BOOK}`);
  await page.getByRole("button", { name: "Quero ler", exact: true }).click();
  await expect(page.getByText("Suas tags")).toBeVisible();
  await page.goto(`/u/${user.handle}?tab=estante`);
  await page.getByPlaceholder(/Buscar entre/).fill("zzz-nada");
  await expect(page.getByText("Nada na estante com “zzz-nada”.")).toBeVisible();
  const csv = await page.request.get("/api/me/export.csv");
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(await csv.text()).toContain("to-read");
});
