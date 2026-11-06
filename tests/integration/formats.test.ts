import { describe, expect, it } from "vitest";
import {
  logReadingSession,
  setReadingFormat,
  setShelfStatus,
  updateProgress,
} from "@/lib/actions/shelf";
import { getReadingNow } from "@/lib/queries/profile";
import { testDb } from "./setup";

const BOOK = "book-1";
const entry = () =>
  testDb.userBook.findFirstOrThrow({
    where: { userId: "user-test", bookId: BOOK },
  });

describe("reading formats", () => {
  it("tracks e-books by percentage and converts to pages", async () => {
    await setShelfStatus(BOOK, "READING");
    expect((await setReadingFormat(BOOK, "EBOOK")).ok).toBe(true);
    const res = await logReadingSession(BOOK, {
      date: "2026-10-02",
      percentEnd: "50",
      minutes: "40",
    });
    expect(res.ok).toBe(true);
    expect(await entry()).toMatchObject({
      format: "EBOOK",
      progressPercent: 50,
      currentPage: 105,
    });
    const session = await testDb.readingSession.findFirstOrThrow();
    expect(session).toMatchObject({
      format: "EBOOK",
      progressEnd: 0.5,
      pages: 105,
    });
    const [now] = await getReadingNow("user-test");
    expect(now).toMatchObject({ progress: 50, big: "50%" });
    expect(
      (
        await logReadingSession(BOOK, {
          date: "2026-10-03",
          percentEnd: "120",
          minutes: "10",
        })
      ).ok,
    ).toBe(false);
  });

  it("tracks audiobooks by time and finishes at the end", async () => {
    await setShelfStatus(BOOK, "READING");
    await setReadingFormat(BOOK, "AUDIO", { audioLength: "10h" });
    await updateProgress(BOOK, { audioPosition: "2h30" });
    expect(await entry()).toMatchObject({
      audioPosition: 150,
      audioLength: 600,
    });
    const res = await logReadingSession(BOOK, {
      date: "2026-10-04",
      audioPosition: "10:00",
      minutes: "60",
    });
    expect(res).toEqual({ ok: true, data: { reachedEnd: true } });
    expect((await updateProgress(BOOK, { audioPosition: "11h" })).ok).toBe(
      false,
    );
  });

  it("converts progress when switching formats", async () => {
    await setShelfStatus(BOOK, "READING");
    await updateProgress(BOOK, { currentPage: "42" });
    await setReadingFormat(BOOK, "EBOOK");
    expect((await entry()).progressPercent).toBe(20);
    await setReadingFormat(BOOK, "AUDIO", { audioLength: 300 });
    expect((await entry()).audioPosition).toBe(60);
  });
});
