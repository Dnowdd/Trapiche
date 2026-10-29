import { describe, expect, it } from "vitest";
import { cleanAuthor, editionScore, groupWorks, workKey } from "@/lib/editions";
import { publisherCore, toIsbn13 } from "@/lib/open-library";
import type { GoogleBooksVolume } from "@/lib/types/book";

const vol = (
  id: string,
  info: Partial<GoogleBooksVolume["volumeInfo"]>,
): GoogleBooksVolume =>
  ({ id, volumeInfo: { title: "", ...info } }) as GoogleBooksVolume;

describe("workKey", () => {
  it("matches reordered titles and accent or case differences", () => {
    expect(
      workKey(
        "A origem da família, do Estado e da propriedade privada",
        "Friedrich Engels",
      ),
    ).toBe(
      workKey(
        "A Origem da Familia, da Propriedade Privada e do Estado",
        "F. Engels",
      ),
    );
  });

  it("separates works by different authors", () => {
    expect(workKey("Tudo é rio", "Carla Madeira")).not.toBe(
      workKey("Tudo é rio", "Outro Autor"),
    );
  });
});

describe("editionScore", () => {
  it("prefers known publishers with covers over self-published ones", () => {
    const boitempo = vol("a", {
      publisher: "Boitempo Editorial",
      imageLinks: { thumbnail: "x" },
    });
    const selfPub = vol("b", {
      publisher: "Clube de Autores",
      imageLinks: { thumbnail: "x" },
    });
    expect(editionScore(boitempo)).toBeGreaterThan(editionScore(selfPub));
  });
});

describe("groupWorks", () => {
  const engels = (id: string, publisher?: string) =>
    vol(id, {
      title: "A origem da família, do Estado e da propriedade privada",
      authors: ["Friedrich Engels"],
      publisher,
      imageLinks: { thumbnail: "x" },
    });

  it("groups editions, ranks the best one first and drops non-matching works", () => {
    const works = groupWorks(
      [
        engels("self", "Clube de Autores"),
        vol("other", {
          title: "Negócios familiares",
          authors: ["X"],
          publisher: "Y",
        }),
        engels("boitempo", "Boitempo Editorial"),
        engels("nopub"),
      ],
      "a origem da família",
    );
    expect(works).toHaveLength(1);
    expect(works[0].main.id).toBe("boitempo");
    expect(works[0].editions.map((e) => e.id)).toEqual(["boitempo", "self"]);
  });
});

describe("toIsbn13", () => {
  it("converts ISBN-10 and keeps ISBN-13", () => {
    expect(toIsbn13("6555871784")).toBe("9786555871784");
    expect(toIsbn13("978-65-5587-178-4")).toBe("9786555871784");
    expect(toIsbn13("123")).toBeNull();
    expect(toIsbn13(null)).toBeNull();
  });
});

describe("cleanAuthor", () => {
  it("drops catalog dates and flips surname-first names", () => {
    expect(cleanAuthor("Carla Madeira, 1964-")).toBe("Carla Madeira");
    expect(cleanAuthor("Machado de Assis (1839-1908)")).toBe(
      "Machado de Assis",
    );
    expect(cleanAuthor("Assis, Machado de, 1839-1908.")).toBe(
      "Machado de Assis",
    );
    expect(cleanAuthor("Friedrich Engels")).toBe("Friedrich Engels");
    expect(cleanAuthor("Carla Madeira Su00e9rio")).toBe("Carla Madeira Sério");
    expect(cleanAuthor("Martin Luther King, Jr.")).toBe(
      "Martin Luther King, Jr.",
    );
  });
});

describe("publisherCore", () => {
  it("drops generic words from publisher names", () => {
    expect(publisherCore("Editora Rocco")).toBe("Rocco");
    expect(publisherCore("Boitempo Editorial")).toBe("Boitempo");
    expect(publisherCore("Companhia das Letras")).toBe("Companhia das Letras");
    expect(publisherCore("Editora")).toBe("Editora");
  });
});

describe("asIsbn", async () => {
  const { asIsbn } = await import("@/lib/google-books");
  it("recognizes ISBN-10 and ISBN-13 and ignores other text", () => {
    expect(asIsbn("978-65-5587-178-4")).toBe("9786555871784");
    expect(asIsbn("6555871784")).toBe("9786555871784");
    expect(asIsbn("1984")).toBeNull();
    expect(asIsbn("12345678901234")).toBeNull();
  });
});
