import { describe, expect, it } from "vitest";
import { toGoodreadsCsv } from "@/lib/import/export";
import { mapRows, parseCsv } from "@/lib/import/csv";

describe("goodreads csv export", () => {
  it("round-trips through the importer", () => {
    const csv = toGoodreadsCsv([
      {
        id: "OL1M",
        title: 'Grande Sertão: "Veredas"',
        authors: ["João Guimarães Rosa", "Outro"],
        isbn10: "8535908773",
        isbn13: "9788535908770",
        publisher: "Cia, das Letras",
        publishedDate: "2019-05-01",
        pageCount: 600,
        status: "READ",
        addedAt: new Date("2024-01-02T10:00:00Z"),
        readAt: new Date("2024-03-10T00:00:00Z"),
        readCount: 1,
        rating: 4.5,
        review: "Linha 1\nLinha 2, com vírgula",
        spoiler: false,
        tags: ["clube do livro"],
      },
      {
        id: "OL2M",
        title: "Torto Arado",
        authors: [],
        isbn10: null,
        isbn13: null,
        publisher: null,
        publishedDate: null,
        pageCount: null,
        status: "ABANDONED",
        addedAt: new Date("2024-02-01T00:00:00Z"),
        readAt: null,
        readCount: 0,
        rating: null,
        review: null,
        spoiler: false,
        tags: [],
      },
    ]);
    expect(csv.startsWith("﻿Book Id,Title,Author")).toBe(true);
    const { source, rows } = mapRows(parseCsv(csv));
    expect(source).toBe("GOODREADS");
    expect(rows[0]).toMatchObject({
      title: 'Grande Sertão: "Veredas"',
      author: "João Guimarães Rosa",
      isbn: "9788535908770",
      shelf: "READ",
      rating: 5,
      dateRead: "2024-03-10",
      review: "Linha 1\nLinha 2, com vírgula",
      tags: ["clube do livro"],
    });
    expect(rows[1]).toMatchObject({ title: "Torto Arado", shelf: "ABANDONED" });
  });
});
