import { describe, expect, it } from "vitest";
import {
  addPastReading,
  deleteReading,
  finishBook,
  setShelfStatus,
  updateReading,
} from "@/lib/actions/shelf";
import { saveReview } from "@/lib/actions/reviews";
import { testDb, viewer } from "./setup";

const BOOK = "book-1";
const USER = "user-test";

const kinds = async () =>
  (
    await testDb.activity.findMany({
      where: { userId: USER, bookId: BOOK },
      orderBy: { createdAt: "asc" },
    })
  ).map((a) => a.kind);

const readings = () =>
  testDb.reading.findMany({
    where: { userId: USER, bookId: BOOK },
    orderBy: { number: "asc" },
  });

describe("shelf status", () => {
  it("requires a signed-in user", async () => {
    viewer.id = null;
    expect(await setShelfStatus(BOOK, "WANT")).toEqual({
      ok: false,
      error: "Entre na sua conta para continuar.",
    });
  });

  it("collapses quick status changes into the latest activity", async () => {
    await setShelfStatus(BOOK, "WANT");
    await setShelfStatus(BOOK, "READING");
    await finishBook(BOOK, {});
    expect(await kinds()).toEqual(["FINISHED"]);
  });

  it("keeps older activities outside the undo window", async () => {
    await setShelfStatus(BOOK, "WANT");
    await testDb.activity.updateMany({
      data: { createdAt: new Date(Date.now() - 2 * 3_600_000) },
    });
    await setShelfStatus(BOOK, "READING");
    expect(await kinds()).toEqual(["ADDED_TO_SHELF", "STARTED"]);
  });

  it("drops the start when a reading is undone without sessions", async () => {
    await setShelfStatus(BOOK, "READING");
    await testDb.activity.updateMany({
      data: { createdAt: new Date(Date.now() - 2 * 3_600_000) },
    });
    await testDb.reading.updateMany({
      data: { createdAt: new Date(Date.now() - 2 * 3_600_000) },
    });
    await setShelfStatus(BOOK, "WANT");
    expect(await readings()).toHaveLength(0);
    expect(await kinds()).toEqual(["ADDED_TO_SHELF"]);
  });

  it("removing from the shelf wipes reading history but keeps the review", async () => {
    await finishBook(BOOK, { finishedAt: "2026-01-10" });
    await saveReview(BOOK, { rating: 4, text: "Lindo" });
    await setShelfStatus(BOOK, null);

    expect(await readings()).toHaveLength(0);
    expect(await kinds()).toEqual(["REVIEW"]);
    const entry = await testDb.userBook.findFirstOrThrow({
      where: { bookId: BOOK },
    });
    expect(entry.status).toBeNull();
  });

  it("does not count a re-added book as a reread", async () => {
    await finishBook(BOOK, {});
    await setShelfStatus(BOOK, null);
    await finishBook(BOOK, {});
    expect((await readings()).map((r) => r.number)).toEqual([1]);
  });

  it("treats finish → want → finish within minutes as a correction", async () => {
    await finishBook(BOOK, {});
    await setShelfStatus(BOOK, "WANT");
    await finishBook(BOOK, {});
    expect((await readings()).map((r) => [r.number, r.status])).toEqual([
      [1, "FINISHED"],
    ]);
    expect(await kinds()).toEqual(["FINISHED"]);
  });

  it("keeps an old finish when the book goes back to the pile", async () => {
    await finishBook(BOOK, {});
    await testDb.userBook.updateMany({
      data: { statusChangedAt: new Date(Date.now() - 2 * 3_600_000) },
    });
    await setShelfStatus(BOOK, "WANT");
    await finishBook(BOOK, {});
    expect((await readings()).map((r) => r.number)).toEqual([1, 2]);
  });

  it("reopens a just-finished book when marked as reading again", async () => {
    await setShelfStatus(BOOK, "READING");
    await finishBook(BOOK, {});
    await setShelfStatus(BOOK, "READING");
    expect((await readings()).map((r) => [r.number, r.status])).toEqual([
      [1, "ACTIVE"],
    ]);
  });

  it("only allows rereading a finished book", async () => {
    const blocked = await setShelfStatus(BOOK, "REREADING");
    expect(blocked.ok).toBe(false);

    await finishBook(BOOK, {});
    expect((await setShelfStatus(BOOK, "REREADING")).ok).toBe(true);
    expect((await readings()).map((r) => [r.number, r.status])).toEqual([
      [1, "FINISHED"],
      [2, "ACTIVE"],
    ]);
  });
});

describe("finishing with optional dates", () => {
  it("accepts no dates at all", async () => {
    expect(await finishBook(BOOK, {})).toEqual({
      ok: true,
      data: { days: null },
    });
    const [r] = await readings();
    expect(r.startedAt).toBeNull();
    expect(r.endedAt).toBeNull();
  });

  it("stores year and month precision", async () => {
    await finishBook(BOOK, { startedAt: "2021", finishedAt: "2021-03" });
    const [r] = await readings();
    expect(r.startPrecision).toBe("YEAR");
    expect(r.endPrecision).toBe("MONTH");
    expect(r.endedAt?.toISOString().slice(0, 10)).toBe("2021-03-01");
  });

  it("counts days only with exact dates", async () => {
    const res = await finishBook(BOOK, {
      startedAt: "2021-03-01",
      finishedAt: "2021-03-10",
    });
    expect(res).toEqual({ ok: true, data: { days: 10 } });
  });

  it("allows a partial start inside the end period", async () => {
    expect(
      (await finishBook(BOOK, { startedAt: "2021-05", finishedAt: "2021" })).ok,
    ).toBe(true);
  });

  it("rejects a start after the end and dates in the future", async () => {
    expect(
      (await finishBook(BOOK, { startedAt: "2022", finishedAt: "2021-12-31" }))
        .ok,
    ).toBe(false);
    expect((await finishBook(BOOK, { finishedAt: "2999" })).ok).toBe(false);
    expect((await finishBook(BOOK, { finishedAt: "2021-02-30" })).ok).toBe(
      false,
    );
  });
});

describe("reading history", () => {
  const status = async () =>
    (await testDb.userBook.findFirstOrThrow({ where: { bookId: BOOK } }))
      .status;

  it("registers several past readings and numbers them chronologically", async () => {
    await addPastReading(BOOK, { finishedAt: "2020" });
    await addPastReading(BOOK, { finishedAt: "2012-05" });
    await addPastReading(BOOK, {
      startedAt: "2016-01-02",
      finishedAt: "2016-01-20",
    });
    await addPastReading(BOOK, {});
    await addPastReading(BOOK, { finishedAt: "2024-07-01" });

    const rs = await readings();
    expect(rs).toHaveLength(5);
    expect(rs.map((r) => r.endedAt?.getUTCFullYear() ?? null)).toEqual([
      2012,
      2016,
      2020,
      2024,
      null,
    ]);
    expect(await status()).toBe("READ");
    expect(await kinds()).toEqual([]);
  });

  it("turns a first read in progress into a reread when a past one is added", async () => {
    await setShelfStatus(BOOK, "READING");
    await addPastReading(BOOK, { finishedAt: "2019" });
    expect(await status()).toBe("REREADING");
    expect((await readings()).map((r) => [r.number, r.status])).toEqual([
      [1, "FINISHED"],
      [2, "ACTIVE"],
    ]);
  });

  it("reads again after already finished", async () => {
    await finishBook(BOOK, { finishedAt: "2021-03-10" });
    await finishBook(BOOK, { finishedAt: "2026-01-05" });
    expect((await readings()).map((r) => r.number)).toEqual([1, 2]);
  });

  it("edits dates and renumbers", async () => {
    await addPastReading(BOOK, { finishedAt: "2020" });
    await addPastReading(BOOK, { finishedAt: "2022" });
    const [first] = await readings();
    expect((await updateReading(first.id, { finishedAt: "2023-02" })).ok).toBe(
      true,
    );
    const rs = await readings();
    expect(rs.map((r) => [r.id === first.id, r.number])).toEqual([
      [false, 1],
      [true, 2],
    ]);
    expect(rs[1].endPrecision).toBe("MONTH");
    expect(
      (await updateReading(first.id, { startedAt: "2024", finishedAt: "2023" }))
        .ok,
    ).toBe(false);
  });

  it("deleting the only finished reading takes the book out of Read", async () => {
    await addPastReading(BOOK, { finishedAt: "2020" });
    const [r] = await readings();
    await deleteReading(r.id);
    expect(await readings()).toHaveLength(0);
    expect(await status()).toBeNull();
  });

  it("removes the feed entry of a deleted reading and keeps the others", async () => {
    await finishBook(BOOK, { finishedAt: "2021" });
    await testDb.activity.updateMany({
      data: { createdAt: new Date(Date.now() - 2 * 3_600_000) },
    });
    await finishBook(BOOK, { finishedAt: "2026-01" });
    expect(await kinds()).toEqual(["FINISHED", "FINISHED"]);

    const [first] = await readings();
    await deleteReading(first.id);
    const left = await testDb.activity.findMany({ where: { bookId: BOOK } });
    expect(left).toHaveLength(1);
    expect(left[0].readingId).toBe((await readings())[0].id);
  });

  it("cleans feed entries created before readings were linked", async () => {
    await addPastReading(BOOK, { finishedAt: "2020" });
    await testDb.activity.create({
      data: { userId: USER, bookId: BOOK, kind: "FINISHED" },
    });
    const [r] = await readings();
    await deleteReading(r.id);
    expect(await kinds()).toEqual([]);
  });

  it("does not let another user touch a reading", async () => {
    await addPastReading(BOOK, {});
    const [r] = await readings();
    viewer.id = "someone-else";
    expect((await deleteReading(r.id)).ok).toBe(false);
    expect(await readings()).toHaveLength(1);
  });
});

describe("reviews", () => {
  it("accepts half stars and rejects other fractions", async () => {
    expect((await saveReview(BOOK, { rating: 3.5 })).ok).toBe(true);
    expect((await testDb.review.findFirstOrThrow()).rating).toBe(3.5);
    expect((await saveReview(BOOK, { rating: 3.3 })).ok).toBe(false);
    expect((await saveReview(BOOK, { rating: 0 })).ok).toBe(false);
  });
});
