import { describe, expect, it } from "vitest";
import { saveReview } from "@/lib/actions/reviews";
import {
  addPastReading,
  setShelfStatus,
  switchEdition,
} from "@/lib/actions/shelf";
import { getReviews } from "@/lib/queries/book";
import { editionIds, linkWork } from "@/lib/works";
import { testDb, viewer } from "./setup";

async function twoEditions() {
  await testDb.book.create({
    data: {
      id: "book-2",
      title: "Tudo É Rio",
      authors: ["Carla Madeira"],
      publisher: "Record",
    },
  });
  for (const id of ["book-1", "book-2"]) {
    const b = await testDb.book.findUniqueOrThrow({ where: { id } });
    await linkWork(b);
  }
}

async function secondUser() {
  const now = new Date();
  await testDb.user.create({
    data: {
      id: "user-2",
      name: "Bruno",
      email: "bruno@example.com",
      emailVerified: true,
      handle: "bruno",
      createdAt: now,
      updatedAt: now,
    },
  });
}

describe("works", () => {
  it("links editions of the same book to one work", async () => {
    await twoEditions();
    expect((await editionIds("book-1")).sort()).toEqual(["book-1", "book-2"]);
    expect(await testDb.work.count()).toBe(1);
  });

  it("keeps different books in different works", async () => {
    await testDb.book.create({
      data: { id: "book-3", title: "Véspera", authors: ["Carla Madeira"] },
    });
    for (const id of ["book-1", "book-3"])
      await linkWork(await testDb.book.findUniqueOrThrow({ where: { id } }));
    expect(await editionIds("book-1")).toEqual(["book-1"]);
  });

  it("shows reviews from every edition with the edition label", async () => {
    await twoEditions();
    await secondUser();
    await saveReview("book-1", { rating: 5, text: "Lindo" });
    viewer.id = "user-2";
    await saveReview("book-2", { rating: 3.5, text: "Bom" });

    const page = await getReviews("book-1", null, { take: 10 });
    expect(page.total).toBe(2);
    expect(page.items.find((r) => r.handle === "bruno")?.edition).toBe(
      "Record",
    );
    expect(page.items.find((r) => r.handle === "teste")?.edition).toBeNull();
  });

  it("keeps a single review per reader across editions", async () => {
    await twoEditions();
    await saveReview("book-1", { rating: 4, text: "Primeira" });
    await saveReview("book-2", { rating: 2.5, text: "Mudei de ideia" });
    const reviews = await testDb.review.findMany();
    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({ bookId: "book-1", rating: 2.5 });
  });

  it("lets each edition keep its own shelf entry", async () => {
    await twoEditions();
    await setShelfStatus("book-1", "WANT");
    await setShelfStatus("book-2", "READING");
    const entries = await testDb.userBook.findMany({
      orderBy: { bookId: "asc" },
    });
    expect(entries.map((e) => [e.bookId, e.status])).toEqual([
      ["book-1", "WANT"],
      ["book-2", "READING"],
    ]);
  });

  it("moves shelf, readings, review and list items to another edition", async () => {
    await twoEditions();
    await addPastReading("book-1", { finishedAt: "2020" });
    await saveReview("book-1", { rating: 4, text: "Bom" });
    const list = await testDb.list.create({
      data: {
        title: "Favoritos",
        ownerId: "user-test",
        members: { create: { userId: "user-test", role: "OWNER" } },
        items: { create: { bookId: "book-1", addedById: "user-test" } },
      },
    });

    expect((await switchEdition("book-1", "book-2")).ok).toBe(true);

    const entry = await testDb.userBook.findFirstOrThrow();
    expect(entry).toMatchObject({ bookId: "book-2", status: "READ" });
    expect((await testDb.reading.findFirstOrThrow()).bookId).toBe("book-2");
    expect((await testDb.review.findFirstOrThrow()).bookId).toBe("book-2");
    expect(
      (await testDb.listItem.findFirstOrThrow({ where: { listId: list.id } }))
        .bookId,
    ).toBe("book-2");
  });

  it("refuses to switch between different books", async () => {
    await testDb.book.create({
      data: { id: "book-3", title: "Véspera", authors: ["Carla Madeira"] },
    });
    await setShelfStatus("book-1", "WANT");
    expect((await switchEdition("book-1", "book-3")).ok).toBe(false);
  });
});
