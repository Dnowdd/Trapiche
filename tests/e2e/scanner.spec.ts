import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { writeBarcodeVideo } from "./barcode";

const ISBN = "9788580331431";
const video = writeBarcodeVideo(
  ISBN,
  join(process.cwd(), "test-results", "fixtures"),
);

test.use({
  permissions: ["camera"],
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-video-capture=${video}`,
    ],
  },
});

test("reads an ISBN barcode with the camera without BarcodeDetector", async ({
  page,
}) => {
  await page.addInitScript(() => {
    delete (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector;
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Escanear código de barras" })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "Escanear livro" }),
  ).toBeVisible();
  await page.waitForURL(/\/book\/|\/search\?q=9788580331431/, {
    timeout: 45_000,
  });
  expect(page.url()).toMatch(/\/book\/OL\w+M|9788580331431/);
});
