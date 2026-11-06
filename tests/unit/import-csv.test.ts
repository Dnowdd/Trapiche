import { describe, expect, it } from "vitest";
import {
  detectSource,
  mapRows,
  mapShelf,
  parseCsv,
  parseDate,
} from "@/lib/import/csv";

const GOODREADS = [
  "Book Id,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Average Rating,Publisher,Binding,Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,Bookshelves with positions,Exclusive Shelf,My Review,Spoiler,Private Notes,Read Count,Owned Copies",
  '1,"Grande Sertão: Veredas","João Guimarães Rosa","Rosa, João Guimarães",,"=""8535908773""","=""9788535908770""",5,4.3,Cia,Paperback,600,2001,1956,2024/03/10,2024/01/02,"clássicos, read","clássicos (#1), read (#3)",read,"Uma travessia.<br/>Inesquecível.",,,1,0',
  '2,"Torto Arado","Itamar Vieira Junior",,,"=""""","=""""",0,4.5,Todavia,Paperback,264,2019,2019,,2024/02/01,"clube-do-livro, to-read","",to-read,,,,0,0',
  '3,"Livro largado","Fulano",,,,,2,3,,,,,,,2024/02/01,did-not-finish,,did-not-finish,,,,0,0',
].join("\n");

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, CRLF and BOM", () => {
    const rows = parseCsv('﻿a,b\r\n"x, y","he said ""oi"""\r\n');
    expect(rows).toEqual([
      ["a", "b"],
      ["x, y", 'he said "oi"'],
    ]);
  });

  it("detects semicolon-separated files", () => {
    expect(parseCsv("titulo;autor\nDom Casmurro;Machado")).toEqual([
      ["titulo", "autor"],
      ["Dom Casmurro", "Machado"],
    ]);
  });

  it("keeps line breaks inside quoted fields", () => {
    expect(parseCsv('t,r\nA,"linha 1\nlinha 2"')[1]).toEqual([
      "A",
      "linha 1\nlinha 2",
    ]);
  });
});

describe("mapRows", () => {
  it("maps a Goodreads export", () => {
    const { source, rows } = mapRows(parseCsv(GOODREADS));
    expect(source).toBe("GOODREADS");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      title: "Grande Sertão: Veredas",
      author: "João Guimarães Rosa",
      isbn: "9788535908770",
      shelf: "READ",
      rating: 5,
      review: "Uma travessia.\nInesquecível.",
      dateRead: "2024-03-10",
      tags: ["clássicos"],
    });
    expect(rows[1]).toMatchObject({
      shelf: "WANT",
      rating: null,
      isbn: null,
      tags: ["clube do livro"],
    });
    expect(rows[2].shelf).toBe("ABANDONED");
  });

  it("maps a Portuguese spreadsheet", () => {
    const { source, rows } = mapRows(
      parseCsv(
        "Título;Autor;ISBN;Estante;Nota;Data de leitura\nVidas Secas;Graciliano Ramos;8501000000;Lido;9;12/05/2023\nO Cortiço;Aluísio Azevedo;;Quero ler;;",
      ),
    );
    expect(source).toBe("SKOOB");
    expect(rows[0]).toMatchObject({
      shelf: "READ",
      rating: 4.5,
      dateRead: "2023-05-12",
      isbn: "9788501000002",
    });
    expect(rows[1].shelf).toBe("WANT");
  });

  it("infers read when only a finish date exists", () => {
    const { rows } = mapRows(parseCsv("title,date read\nX,2022-01-05"));
    expect(rows[0].shelf).toBe("READ");
  });

  it("reports a missing title column", () => {
    expect(mapRows(parseCsv("autor,isbn\nA,1")).missingTitle).toBe(true);
  });
});

describe("helpers", () => {
  it("maps shelf names in both languages", () => {
    expect(mapShelf("currently-reading")).toBe("READING");
    expect(mapShelf("Relendo")).toBe("REREADING");
    expect(mapShelf("Abandonei")).toBe("ABANDONED");
    expect(mapShelf("favoritos")).toBeNull();
  });

  it("parses and validates dates", () => {
    expect(parseDate("2024/2/29")).toBe("2024-02-29");
    expect(parseDate("31/02/2024")).toBeNull();
    expect(parseDate("1999")).toBe("1999-12-31");
    expect(parseDate("ontem")).toBeNull();
  });

  it("detects the source by headers", () => {
    expect(detectSource(["Title", "Exclusive Shelf"])).toBe("GOODREADS");
    expect(detectSource(["name", "writer"])).toBe("CSV");
  });
});
