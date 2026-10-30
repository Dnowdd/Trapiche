import { describe, expect, it } from "vitest";
import {
  finishBook,
  logReadingSession,
  setShelfStatus,
  updateProgress,
} from "@/lib/actions/shelf";
import { getBookPage } from "@/lib/queries/book";
import { getDiario } from "@/lib/queries/profile";
import { today, toISODay } from "@/lib/dates";
import { testDb } from "./setup";

const BOOK = "book-1";
const USER = "user-test";

const active = () =>
  testDb.reading.findFirstOrThrow({
    where: { userId: USER, bookId: BOOK, status: "ACTIVE" },
  });

describe("reading start dates", () => {
  it("never invents a start date and keeps partial ones", async () => {
    expect((await setShelfStatus(BOOK, "READING")).ok).toBe(true);
    expect((await active()).startedAt).toBeNull();
    const page = await getBookPage(BOOK, USER);
    expect(page!.viewer!.reading!.started).toBeNull();

    await updateProgress(BOOK, { currentPage: 10, startedAt: "2026-03" });
    const r = await active();
    expect(toISODay(r.startedAt!)).toBe("2026-03-01");
    expect(r.startPrecision).toBe("MONTH");

    await updateProgress(BOOK, { currentPage: 10, startedAt: "" });
    expect((await active()).startedAt).toBeNull();
  });

  it("uses the start date chosen when marking as reading", async () => {
    await setShelfStatus(BOOK, "READING", { startedAt: "2025" });
    const r = await active();
    expect(toISODay(r.startedAt!)).toBe("2025-01-01");
    expect(r.startPrecision).toBe("YEAR");
    const future = `${today().getUTCFullYear() + 1}`;
    await setShelfStatus(BOOK, "WANT");
    expect(
      (await setShelfStatus(BOOK, "READING", { startedAt: future })).ok,
    ).toBe(false);
  });
});

describe("reading sessions with partial dates", () => {
  it("stores the precision and keeps month or year sessions out of daily stats", async () => {
    await setShelfStatus(BOOK, "READING");
    expect(
      (
        await logReadingSession(BOOK, {
          date: "2025-06",
          pageEnd: 40,
          minutes: 60,
        })
      ).ok,
    ).toBe(true);
    await logReadingSession(BOOK, {
      date: toISODay(today()),
      pageEnd: 60,
      minutes: 30,
    });
    const sessions = await testDb.readingSession.findMany({
      where: { userId: USER },
      orderBy: { date: "asc" },
    });
    expect(sessions.map((s) => s.datePrecision)).toEqual(["MONTH", "DAY"]);
    expect((await active()).startPrecision).toBe("MONTH");

    const diary = await getDiario(USER, 20);
    expect(Object.keys(diary.minutesByDay)).toEqual([toISODay(today())]);
    expect(diary.streak).toBe(1);
    expect(diary.entries.map((e) => e.date)).toContain("jun/2025");
    expect(diary.years).toContain(2025);
  });
});

describe("page count filled by the reader", () => {
  it("fills a missing page count once and enforces it", async () => {
    await testDb.book.update({
      where: { id: BOOK },
      data: { pageCount: null },
    });
    await setShelfStatus(BOOK, "READING");
    const res = await logReadingSession(BOOK, {
      date: toISODay(today()),
      pageEnd: 50,
      minutes: 20,
      pageCount: 300,
    });
    expect(res.ok).toBe(true);
    expect(
      (await testDb.book.findUniqueOrThrow({ where: { id: BOOK } })).pageCount,
    ).toBe(300);

    await updateProgress(BOOK, { currentPage: 60, pageCount: 999 });
    expect(
      (await testDb.book.findUniqueOrThrow({ where: { id: BOOK } })).pageCount,
    ).toBe(300);
    expect((await updateProgress(BOOK, { currentPage: 400 })).ok).toBe(false);
    expect(
      (await updateProgress(BOOK, { currentPage: 1, pageCount: 0 })).ok,
    ).toBe(true);
  });
});

describe("finishing with a review", () => {
  it("publishes the rating and review together with the finished reading", async () => {
    await setShelfStatus(BOOK, "READING");
    const res = await finishBook(BOOK, {
      finishedAt: "2026-03",
      review: { rating: 4.5, text: "Ótimo.", spoiler: true },
    });
    expect(res.ok).toBe(true);
    const review = await testDb.review.findFirstOrThrow({
      where: { userId: USER, bookId: BOOK },
    });
    expect(review).toMatchObject({
      rating: 4.5,
      text: "Ótimo.",
      spoiler: true,
    });
    const kinds = await testDb.activity.findMany({
      where: { userId: USER, bookId: BOOK },
      select: { kind: true },
    });
    expect(kinds.map((a) => a.kind).sort()).toEqual(["FINISHED", "REVIEW"]);
  });

  it("rejects an invalid rating without finishing the book", async () => {
    await setShelfStatus(BOOK, "READING");
    const res = await finishBook(BOOK, { review: { rating: 7 } });
    expect(res.ok).toBe(false);
    expect((await active()).status).toBe("ACTIVE");
  });
});
