import { describe, expect, it } from "vitest";
import {
  deleteLoan,
  lendBook,
  returnLoan,
  updateLoan,
} from "@/lib/actions/loans";
import { createChallenge, deleteChallenge } from "@/lib/actions/challenges";
import { getOpenLoans, remindOverdueLoans } from "@/lib/queries/loans";
import { getChallenges } from "@/lib/queries/challenges";
import { getRetroStats } from "@/lib/queries/retro-stats";
import { getRecommendations } from "@/lib/queries/recommendations";
import { testDb, viewer } from "./setup";

const USER = "user-test";
const BOOK = "book-1";

async function finish(bookId: string, endedAt: string, userId = USER) {
  await testDb.userBook.upsert({
    where: { userId_bookId: { userId, bookId } },
    create: { userId, bookId, status: "READ" },
    update: { status: "READ" },
  });
  await testDb.reading.create({
    data: {
      userId,
      bookId,
      number: 1,
      status: "FINISHED",
      endedAt: new Date(`${endedAt}T00:00:00Z`),
    },
  });
}

describe("loans", () => {
  it("lends, refuses a second open loan, edits and returns", async () => {
    const res = await lendBook(BOOK, {
      person: "  Ana   Paula ",
      lentAt: "2026-10-01",
      dueAt: "2026-10-20",
    });
    expect(res.ok).toBe(true);
    const id = res.ok ? res.data!.id : "";
    expect((await lendBook(BOOK, { person: "Bia" })).ok).toBe(false);
    expect(
      (
        await updateLoan(id, {
          person: "Ana",
          lentAt: "2026-10-01",
          dueAt: "2026-09-01",
        })
      ).ok,
    ).toBe(false);
    const [open] = await getOpenLoans(USER);
    expect(open).toMatchObject({ person: "Ana Paula", overdue: true });

    expect((await returnLoan(id, "2026-10-25")).ok).toBe(true);
    expect(await getOpenLoans(USER)).toHaveLength(0);
    expect((await lendBook(BOOK, { person: "Bia" })).ok).toBe(true);
  });

  it("validates dates and keeps loans private to the owner", async () => {
    expect((await lendBook(BOOK, { person: "" })).ok).toBe(false);
    expect(
      (await lendBook(BOOK, { person: "Ana", lentAt: "2099-01-01" })).ok,
    ).toBe(false);
    const res = await lendBook(BOOK, { person: "Ana" });
    const id = res.ok ? res.data!.id : "";
    viewer.id = "someone-else";
    await deleteLoan(id);
    viewer.id = USER;
    expect(await testDb.loan.count()).toBe(1);
  });

  it("reminds overdue loans once every two weeks", async () => {
    await lendBook(BOOK, {
      person: "Ana",
      lentAt: "2026-01-01",
      dueAt: "2026-02-01",
    });
    expect((await remindOverdueLoans()).reminded).toBe(1);
    expect((await remindOverdueLoans()).reminded).toBe(0);
    const n = await testDb.notification.findFirstOrThrow();
    expect(n).toMatchObject({ kind: "LOAN_DUE", userId: USER });
    const loan = await testDb.loan.findFirstOrThrow();
    await returnLoan(loan.id);
    expect(await testDb.notification.count()).toBe(0);
  });
});

describe("challenges", () => {
  it("counts finished books by language, length, tag and format", async () => {
    await testDb.book.update({ where: { id: BOOK }, data: { language: "pt" } });
    await testDb.book.create({
      data: {
        id: "book-2",
        title: "Calhamaço",
        authors: ["Autora"],
        pageCount: 900,
        language: "en",
      },
    });
    await finish(BOOK, "2026-03-01");
    await finish("book-2", "2026-04-01");
    await finish(BOOK, "2025-03-01");
    const tag = await testDb.tag.create({
      data: { userId: USER, name: "clube", color: "#433e12" },
    });
    const entry = await testDb.userBook.findFirstOrThrow({
      where: { bookId: "book-2" },
    });
    await testDb.userBookTag.create({
      data: { userBookId: entry.id, tagId: tag.id },
    });
    await testDb.userBook.update({
      where: { id: entry.id },
      data: { format: "AUDIO" },
    });

    const base = { target: 2, startsAt: "2026-01-01", endsAt: "2026-12-31" };
    await createChallenge({
      ...base,
      title: "PT",
      kind: "LANGUAGE",
      value: "pt",
    });
    await createChallenge({ ...base, title: "Longos", kind: "LONG" });
    await createChallenge({
      ...base,
      title: "Clube",
      kind: "TAG",
      value: tag.id,
    });
    await createChallenge({
      ...base,
      title: "Áudio",
      kind: "FORMAT",
      value: "AUDIO",
    });
    await createChallenge({ ...base, title: "Tudo", kind: "ANY" });
    const got = Object.fromEntries(
      (await getChallenges(USER)).map((c) => [c.title, c.done]),
    );
    expect(got).toEqual({ PT: 1, Longos: 1, Clube: 1, Áudio: 1, Tudo: 2 });
  });

  it("validates input and only lets the owner delete", async () => {
    const base = {
      title: "X",
      target: 3,
      startsAt: "2026-01-01",
      endsAt: "2026-12-31",
    };
    expect(
      (await createChallenge({ ...base, kind: "TAG", value: "nope" })).ok,
    ).toBe(false);
    expect(
      (await createChallenge({ ...base, kind: "ANY", target: 0 })).ok,
    ).toBe(false);
    expect(
      (await createChallenge({ ...base, kind: "ANY", endsAt: "2025-01-01" }))
        .ok,
    ).toBe(false);
    const ok = await createChallenge({ ...base, kind: "ANY" });
    const id = ok.ok ? ok.data!.id : "";
    viewer.id = "someone-else";
    await deleteChallenge(id);
    viewer.id = USER;
    expect(await testDb.challenge.count()).toBe(1);
  });
});

describe("retro stats", () => {
  it("aggregates pages per month, ratings and shares", async () => {
    await testDb.book.update({
      where: { id: BOOK },
      data: { language: "pt", publishedDate: "2019" },
    });
    await finish(BOOK, "2026-03-10");
    const reading = await testDb.reading.findFirstOrThrow();
    await testDb.readingSession.create({
      data: {
        userId: USER,
        bookId: BOOK,
        readingId: reading.id,
        date: new Date("2026-03-05T00:00:00Z"),
        pages: 80,
        minutes: 90,
        pageEnd: 80,
      },
    });
    await testDb.review.create({
      data: { userId: USER, bookId: BOOK, rating: 4.5 },
    });
    const stats = await getRetroStats(USER, 2026);
    expect(stats.byMonth![2]).toMatchObject({
      pages: 80,
      minutes: 90,
      label: "Mar",
    });
    expect(stats.ratings.find((r) => r.stars === 5)?.count).toBe(1);
    expect(stats.average).toBe(4.5);
    expect(stats.decades).toEqual([
      { label: "Anos 2010", count: 1, percent: 100 },
    ]);
    expect(stats.formats[0]).toMatchObject({ label: "Físico", percent: 100 });
    expect((await getRetroStats(USER, 2026, 3)).byMonth).toBeNull();
  });
});

describe("recommendations", () => {
  it("suggests what co-readers read and never what you already have", async () => {
    const now = new Date();
    await testDb.user.create({
      data: {
        id: "peer",
        name: "Peer",
        email: "p@x.com",
        emailVerified: true,
        handle: "peer",
        createdAt: now,
        updatedAt: now,
      },
    });
    await testDb.book.create({
      data: {
        id: "book-2",
        title: "Outro livro",
        authors: ["Fulana"],
        coverUrl: "https://x/y.jpg",
      },
    });
    await testDb.book.create({
      data: {
        id: "book-3",
        title: "Mais um",
        authors: ["Carla Madeira"],
        coverUrl: "https://x/z.jpg",
      },
    });
    await finish(BOOK, "2026-03-01");
    await finish(BOOK, "2026-03-01", "peer");
    await finish("book-2", "2026-04-01", "peer");
    const recs = await getRecommendations(USER, 8);
    const ids = recs.map((r) => r.book.id);
    expect(ids).toContain("book-2");
    expect(ids).toContain("book-3");
    expect(ids).not.toContain(BOOK);
    expect(recs.find((r) => r.book.id === "book-2")?.reason).toBe(
      "Quem leu Tudo é rio também leu",
    );
    expect(recs.find((r) => r.book.id === "book-3")?.reason).toBe(
      "Mais de Carla Madeira",
    );
  });
});
