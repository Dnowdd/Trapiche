import { describe, expect, it } from "vitest";
import { deleteAccount } from "@/lib/actions/profile";
import { saveReview } from "@/lib/actions/reviews";
import { finishBook } from "@/lib/actions/shelf";
import { testDb } from "./setup";

describe("account deletion", () => {
  it("requires the exact handle", async () => {
    expect((await deleteAccount("outra")).ok).toBe(false);
    expect(await testDb.user.count()).toBe(1);
  });

  it("removes the user and everything they created", async () => {
    await finishBook("book-1", { finishedAt: "2021" });
    await saveReview("book-1", { rating: 4, text: "Bom" });
    expect((await deleteAccount("@teste")).ok).toBe(true);
    expect(await testDb.user.count()).toBe(0);
    expect(await testDb.userBook.count()).toBe(0);
    expect(await testDb.reading.count()).toBe(0);
    expect(await testDb.review.count()).toBe(0);
    expect(await testDb.activity.count()).toBe(0);
    expect(await testDb.book.count()).toBe(1);
  });
});
