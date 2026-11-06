import { expect, test } from "@playwright/test";
import { BOOK } from "./helpers";

test("home exposes SEO metadata, structured data and the manifest", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Trapiche/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /opengraph-image/,
  );
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  const ld = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  expect(JSON.parse(ld!)[0]["@type"]).toBe("WebSite");

  const manifest = await request.get("/manifest.webmanifest");
  expect((await manifest.json()).short_name).toBe("Trapiche");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /importar");
});

test("book page has rich metadata, a working OG image and quotes", async ({
  page,
  request,
}) => {
  await page.goto(`/book/${BOOK}`);
  await expect(page.getByRole("heading", { name: "Citações" })).toBeVisible();
  const ld = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  expect(JSON.parse(ld!)[0]["@type"]).toBe("Book");
  const og = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  const image = await request.get(og!);
  expect(image.headers()["content-type"]).toBe("image/png");
  expect((await image.body()).length).toBeGreaterThan(20_000);
});
