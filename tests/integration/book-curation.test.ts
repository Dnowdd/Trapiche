import { describe, expect, it } from "vitest";
import { releaseBookCuration, updateBookData } from "@/lib/actions/books";
import { testDb } from "./setup";

const edit = {
  title: "Grande Sertão: Veredas",
  authors: "João Guimarães Rosa",
  publishedDate: "1956",
  pageCount: "608",
  coverUrl: "https://covers.openlibrary.org/b/id/1-L.jpg",
};

async function olBook() {
  await testDb.book.create({
    data: {
      id: "OL1M",
      title: "Grande sertão",
      authors: ["[author not identified]"],
    },
  });
}

describe("book curation", () => {
  it("is admin only", async () => {
    await olBook();
    expect(await updateBookData("OL1M", edit)).toEqual({
      ok: false,
      error: "Sem permissão.",
    });
  });

  it("fixes data, locks the edition and can release it", async () => {
    await olBook();
    await testDb.user.update({
      where: { id: "user-test" },
      data: { isAdmin: true },
    });
    expect((await updateBookData("OL1M", edit)).ok).toBe(true);
    const book = await testDb.book.findUniqueOrThrow({ where: { id: "OL1M" } });
    expect(book).toMatchObject({
      title: "Grande Sertão: Veredas",
      authors: ["João Guimarães Rosa"],
      pageCount: 608,
      curatedById: "user-test",
    });
    expect(book.curatedAt).not.toBeNull();
    expect((await releaseBookCuration("OL1M")).ok).toBe(true);
    expect(
      (await testDb.book.findUniqueOrThrow({ where: { id: "OL1M" } }))
        .curatedAt,
    ).toBeNull();
  });

  it("validates input and refuses google books editions", async () => {
    await olBook();
    await testDb.user.update({
      where: { id: "user-test" },
      data: { isAdmin: true },
    });
    expect(
      (
        await updateBookData("OL1M", {
          ...edit,
          coverUrl: "https://evil.example/x.jpg",
        })
      ).ok,
    ).toBe(false);
    expect(
      (await updateBookData("OL1M", { ...edit, publishedDate: "ontem" })).ok,
    ).toBe(false);
    expect((await updateBookData("book-1", edit)).ok).toBe(false);
  });
});
