import { describe, expect, it } from "vitest";
import { getDashboard } from "@/lib/queries/dashboard";
import { getFeaturedBooks } from "@/app/catalog";
import { testDb } from "./setup";

describe("dashboard picks", () => {
  it("fills suggestions from the catalog when popular books are already on the shelf", async () => {
    const featured = await getFeaturedBooks(3);
    const ids = ["book-1", "own-2", "own-3", "own-4"];
    for (const [i, id] of ids.slice(1).entries())
      await testDb.book.create({
        data: { id, title: featured[i].title, authors: [featured[i].author] },
      });
    for (const id of ids)
      await testDb.userBook.create({
        data: { userId: "user-test", bookId: id, status: "WANT" },
      });

    const { picks } = await getDashboard("user-test");
    expect(picks.length).toBeGreaterThanOrEqual(6);
    const shelfTitles = new Set(
      ["Tudo é rio", ...featured.map((b) => b.title)].map((t) =>
        t.toLowerCase(),
      ),
    );
    for (const p of picks)
      expect(shelfTitles.has(p.title.toLowerCase())).toBe(false);
    expect(new Set(picks.map((p) => p.title)).size).toBe(picks.length);
  });
});
