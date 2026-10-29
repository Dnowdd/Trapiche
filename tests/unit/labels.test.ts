import { describe, expect, it } from "vitest";
import { categoryLabel, categoryLabels } from "@/lib/categories";
import { fmtRating, starFill } from "@/components/shared/stars";

describe("categories", () => {
  it("translates BISAC paths and drops unknown or general segments", () => {
    expect(categoryLabel("Philosophy")).toBe("Filosofia");
    expect(categoryLabel("Fiction / Romance / General")).toBe(
      "Ficção · Romance",
    );
    expect(categoryLabel("Unknown Thing")).toBeNull();
    expect(categoryLabels(["Fiction", "Fiction / General", "Unknown"])).toEqual(
      ["Ficção"],
    );
  });
});

describe("stars", () => {
  it("fills whole and half stars", () => {
    expect([0, 1, 2, 3, 4].map((i) => starFill(3.5, i))).toEqual([
      100, 100, 100, 50, 0,
    ]);
    expect([0, 1, 2, 3, 4].map((i) => starFill(4.2, i))).toEqual([
      100, 100, 100, 100, 0,
    ]);
  });

  it("formats ratings in Portuguese", () => {
    expect(fmtRating(3.5)).toBe("3,5");
    expect(fmtRating(4)).toBe("4");
  });
});
