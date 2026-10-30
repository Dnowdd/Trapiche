import { describe, expect, it } from "vitest";
import { loginHref, safeNext } from "@/lib/links";

describe("safeNext", () => {
  it("keeps internal paths", () => {
    expect(safeNext("/suporte")).toBe("/suporte");
    expect(safeNext("/u/ana?tab=estante")).toBe("/u/ana?tab=estante");
  });

  it("rejects anything that could leave the site or loop", () => {
    for (const bad of [
      null,
      "",
      "https://evil.test",
      "//evil.test",
      "/\\evil.test",
      "javascript:alert(1)",
      "/auth?next=/x",
    ])
      expect(safeNext(bad)).toBeNull();
  });
});

describe("loginHref", () => {
  it("carries the page to come back to", () => {
    expect(loginHref("/lists/1")).toBe("/auth?next=%2Flists%2F1");
    expect(loginHref("/", "register")).toBe("/auth?mode=register&next=%2F");
    expect(loginHref("//evil.test")).toBe("/auth");
  });
});
