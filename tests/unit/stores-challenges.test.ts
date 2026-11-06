import { describe, expect, it } from "vitest";
import { storeLinks } from "@/lib/stores";
import { describeChallenge } from "@/lib/challenges";

const book = {
  title: "Torto Arado",
  authors: ["Itamar Vieira Junior"],
  isbn13: "9786580309313",
  isbn10: null,
};

describe("storeLinks", () => {
  it("searches by isbn and adds the affiliate tag only to amazon", () => {
    const [amazon, estante, play] = storeLinks(book, "trapiche-20");
    expect(new URL(amazon.url).searchParams.get("k")).toBe("9786580309313");
    expect(new URL(amazon.url).searchParams.get("tag")).toBe("trapiche-20");
    expect(amazon.sponsored).toBe(true);
    expect(new URL(estante.url).searchParams.get("q")).toBe(
      "Torto Arado Itamar Vieira Junior",
    );
    expect(estante.sponsored).toBe(false);
    expect(new URL(play.url).searchParams.get("c")).toBe("books");
  });

  it("falls back to title and author without isbn or tag", () => {
    const [amazon] = storeLinks({ ...book, isbn13: null }, "");
    expect(new URL(amazon.url).searchParams.get("k")).toBe(
      "Torto Arado Itamar Vieira Junior",
    );
    expect(new URL(amazon.url).searchParams.has("tag")).toBe(false);
    expect(amazon.sponsored).toBe(false);
  });
});

describe("describeChallenge", () => {
  it("describes each kind", () => {
    expect(describeChallenge("LANGUAGE", "pt")).toBe("em português");
    expect(describeChallenge("FORMAT", "AUDIO")).toBe("em audiolivro");
    expect(describeChallenge("LONG", null)).toBe("com 400+ páginas");
    expect(describeChallenge("TAG", "t1", "clássicos")).toBe(
      "com a tag “clássicos”",
    );
    expect(describeChallenge("AUTHOR", "Clarice Lispector")).toBe(
      "de Clarice Lispector",
    );
  });
});
