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

test("the assistant proposes a change and applies it after confirmation", async ({
  page,
}) => {
  const user = await signUp(page);
  await page.goto(`/book/${BOOK}`);
  await page.getByRole("button", { name: /Pergunte ao Prático/ }).click();
  const panel = page.getByRole("dialog", { name: /Prático/ });
  await expect(panel.getByText(/Oi, Leitora/)).toBeVisible();
  await panel.getByRole("button", { name: "Colocar na minha pilha" }).click();
  await expect(panel.getByText("Colocar em “Quero ler”")).toBeVisible();
  await expect(
    panel.getByText("Deixei pronto para você confirmar."),
  ).toBeVisible();

  const before = await sql(
    `select ub.status from "UserBook" ub join "User" u on u.id = ub."userId" where u.handle = $1`,
    [user.handle],
  );
  expect(before).toEqual([]);

  await panel.getByRole("button", { name: "Confirmar" }).click();
  await expect(
    panel.getByText("Está na sua pilha de “Quero ler”."),
  ).toBeVisible();
  const [row] = await sql(
    `select ub.status from "UserBook" ub join "User" u on u.id = ub."userId" where u.handle = $1`,
    [user.handle],
  );
  expect(row.status).toBe("WANT");

  const input = panel.getByLabel("Mensagem para o Prático");
  await input.fill("O que tem na minha estante?");
  await input.press("Enter");
  await expect(
    panel.getByText(/marque “Usar os dados da minha conta”/),
  ).toBeVisible();

  const consent = panel.getByRole("checkbox", {
    name: "Usar os dados da minha conta",
  });
  await expect(consent).not.toBeChecked();
  await consent.check();
  await expect(
    page.getByText("O Prático agora usa os dados da sua conta."),
  ).toBeVisible();
  const [prefs] = await sql(
    `select "assistantShareData" from "User" where handle = $1`,
    [user.handle],
  );
  expect(prefs.assistantShareData).toBe(true);

  await input.fill("O que tem na minha estante?");
  await input.press("Enter");
  const covers = panel.getByRole("region", { name: "Da sua estante" });
  await expect(covers.getByRole("link").first()).toHaveAttribute(
    "href",
    `/book/${BOOK}`,
  );
  await expect(covers.getByText("Quero ler")).toBeVisible();
  await expect(panel.getByText("Quer que eu sugira o próximo?")).toBeVisible();

  await panel.getByRole("button", { name: "Fechar" }).click();
  await expect(panel).toHaveCount(0);
  await page.getByRole("button", { name: /Pergunte ao Prático/ }).click();
  await expect(
    page
      .getByRole("dialog", { name: /Prático/ })
      .getByText("O que tem na minha estante?")
      .first(),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog", { name: /Prático/ })
      .getByRole("checkbox", { name: "Usar os dados da minha conta" }),
  ).toBeChecked();
});

test("data sharing can be turned on before the first message", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/assistente");
  const consent = page.getByRole("checkbox", {
    name: /Usar os dados da minha conta/,
  });
  await expect(consent).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Romances brasileiros para começar" }),
  ).toBeVisible();
  await consent.check();
  await expect(
    page.getByRole("button", { name: "O que eu leio depois?" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: /Usar os dados da minha conta/ }),
  ).toBeChecked();
});

test("conversations are listed, reopened and deleted on the assistant page", async ({
  page,
}) => {
  await signUp(page);
  await page.goto("/assistente");
  await page.getByLabel("Mensagem para o Prático").fill("Oi, quem é você?");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByText(/Sou o Prático em modo de teste/)).toBeVisible();
  await expect(page).toHaveURL(/\/assistente\?c=/);

  const threads = page.getByRole("navigation", { name: "Conversas" });
  await expect(
    threads.getByRole("button", { name: "Oi, quem é você?", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Nova conversa" }).click();
  await expect(page.getByText(/Oi, Leitora/)).toBeVisible();
  await threads
    .getByRole("button", { name: "Oi, quem é você?", exact: true })
    .click();
  await expect(page.getByText(/Sou o Prático em modo de teste/)).toBeVisible();

  page.once("dialog", (d) => d.accept());
  await threads
    .getByRole("button", { name: "Apagar a conversa “Oi, quem é você?”" })
    .click();
  await expect(page.getByText("Conversa apagada.")).toBeVisible();
  await expect(
    page.getByText("Suas conversas aparecem aqui. Só você vê."),
  ).toBeVisible();
});

test("a failed answer can be retried", async ({ page }) => {
  await signUp(page);
  await page.goto("/assistente");
  await page.getByLabel("Mensagem para o Prático").fill("simule um erro");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByRole("log").getByRole("alert")).toContainText(
    "se perdeu no caminho",
  );
  await expect(
    page.getByRole("button", { name: "Tentar de novo" }),
  ).toBeVisible();
});

test("visitors do not see the assistant", async ({ page }) => {
  await page.goto(`/book/${BOOK}`);
  await expect(
    page.getByRole("button", { name: /Pergunte ao Prático/ }),
  ).toHaveCount(0);
  const res = await page.request.post("/api/assistant", {
    data: { message: "oi" },
  });
  expect(res.status()).toBe(401);
});
