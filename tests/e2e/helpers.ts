import { expect, test, type Page } from "@playwright/test";

export const BOOK = "OL44656488M";

export function uniqueUser(prefix = "e2e") {
  const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  return {
    name: "Leitora E2E",
    handle: `${prefix}_${id}`.slice(0, 30),
    email: `${prefix}.${id}@teste.local`,
    password: "Senha-forte-123",
  };
}

export async function signUp(page: Page, user = uniqueUser()) {
  const res = await page.request.post("/api/auth/sign-up/email", {
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
      handle: user.handle,
    },
    headers: { origin: test.info().project.use.baseURL! },
  });
  expect(res.ok()).toBeTruthy();
  return user;
}
