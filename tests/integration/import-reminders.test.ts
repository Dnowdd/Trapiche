import { describe, expect, it, vi } from "vitest";
import { testDb, sentEmails, viewer } from "./setup";

vi.mock("@/lib/open-library", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/open-library")>()),
  editionIdByIsbn: async (isbn: string) =>
    isbn === "9788535908770" ? "book-1" : null,
  searchOpenLibrary: async () => [],
}));
vi.mock("@/lib/google-books", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/google-books")>()),
  fetchVolumes: async () => [],
}));

const { processImport, startImport, cancelImport } =
  await import("@/lib/actions/import");
const { sendReadingReminders, sendMonthlyDigests } =
  await import("@/lib/reminders");

const USER = "user-test";

function csvForm(text: string, name = "goodreads.csv") {
  const form = new FormData();
  form.set("file", new File([text], name, { type: "text/csv" }));
  return form;
}

const GOODREADS = [
  "Title,Author,ISBN13,My Rating,Date Read,Bookshelves,Exclusive Shelf,My Review",
  'Tudo é rio,Carla Madeira,"=""9788535908770""",4,2024/03/10,"favoritos-da-vida, read",read,Lindo.',
  "Livro inexistente,Ninguém,,0,,to-read,to-read,",
].join("\n");

async function runToEnd(jobId: string) {
  for (let i = 0; i < 10; i++) {
    const res = await processImport(jobId);
    if (!res.ok) throw new Error(res.error);
    if (res.data!.status !== "RUNNING") return res.data!;
  }
  throw new Error("import did not finish");
}

describe("import", () => {
  it("imports matched rows with shelf, reading, review and tags", async () => {
    const started = await startImport(csvForm(GOODREADS));
    expect(started.ok).toBe(true);
    const state = await runToEnd(started.ok ? started.data!.id : "");
    expect(state).toMatchObject({
      status: "DONE",
      total: 2,
      imported: 1,
      notFound: 1,
      skipped: 0,
    });
    expect(state.problems.map((p) => p.title)).toEqual(["Livro inexistente"]);

    const entry = await testDb.userBook.findFirstOrThrow({
      where: { userId: USER, bookId: "book-1" },
      include: { tags: { include: { tag: true } } },
    });
    expect(entry.status).toBe("READ");
    expect(entry.tags.map((t) => t.tag.name)).toEqual(["favoritos da vida"]);
    const reading = await testDb.reading.findFirstOrThrow({
      where: { userId: USER, bookId: "book-1" },
    });
    expect(reading.status).toBe("FINISHED");
    expect(reading.endedAt?.toISOString().slice(0, 10)).toBe("2024-03-10");
    const review = await testDb.review.findFirstOrThrow({
      where: { userId: USER },
    });
    expect(review).toMatchObject({ rating: 4, text: "Lindo." });
    expect(await testDb.activity.count({ where: { userId: USER } })).toBe(0);
  });

  it("skips books already on the shelf", async () => {
    await testDb.userBook.create({
      data: { userId: USER, bookId: "book-1", status: "WANT" },
    });
    const started = await startImport(csvForm(GOODREADS));
    const state = await runToEnd(started.ok ? started.data!.id : "");
    expect(state.skipped).toBe(1);
    expect(
      (await testDb.userBook.findFirstOrThrow({ where: { userId: USER } }))
        .status,
    ).toBe("WANT");
  });

  it("refuses a second running import and files without titles", async () => {
    const first = await startImport(csvForm(GOODREADS));
    expect(first.ok).toBe(true);
    expect((await startImport(csvForm(GOODREADS))).ok).toBe(false);
    await cancelImport(first.ok ? first.data!.id : "");
    const bad = await startImport(csvForm("autor,isbn\nX,1"));
    expect(bad.ok).toBe(false);
  });

  it("does not let another user drive the job", async () => {
    const started = await startImport(csvForm(GOODREADS));
    viewer.id = "someone-else";
    const res = await processImport(started.ok ? started.data!.id : "");
    expect(res.ok).toBe(false);
  });
});

describe("reminders", () => {
  it("nudges opted-in readers who stopped logging", async () => {
    const old = new Date(Date.now() - 20 * 86_400_000);
    await testDb.user.update({
      where: { id: USER },
      data: { inactivityReminder: true },
    });
    await testDb.userBook.create({
      data: {
        userId: USER,
        bookId: "book-1",
        status: "READING",
        statusChangedAt: old,
        currentPage: 50,
      },
    });
    expect((await sendReadingReminders()).sent).toBe(1);
    expect(sentEmails).toEqual([{ kind: "reminder", to: "teste@example.com" }]);
    expect((await sendReadingReminders()).sent).toBe(0);
  });

  it("leaves readers alone without opt-in or with recent sessions", async () => {
    const old = new Date(Date.now() - 20 * 86_400_000);
    await testDb.userBook.create({
      data: {
        userId: USER,
        bookId: "book-1",
        status: "READING",
        statusChangedAt: old,
      },
    });
    expect((await sendReadingReminders()).sent).toBe(0);
    await testDb.user.update({
      where: { id: USER },
      data: { inactivityReminder: true },
    });
    const reading = await testDb.reading.create({
      data: { userId: USER, bookId: "book-1", number: 1 },
    });
    await testDb.readingSession.create({
      data: {
        userId: USER,
        bookId: "book-1",
        readingId: reading.id,
        date: new Date(),
        pages: 10,
        minutes: 15,
        pageEnd: 10,
      },
    });
    expect((await sendReadingReminders()).sent).toBe(0);
  });

  it("sends the monthly digest once, only in the first week", async () => {
    await testDb.user.update({
      where: { id: USER },
      data: { monthlyDigest: true, createdAt: new Date(Date.UTC(2026, 0, 1)) },
    });
    await testDb.reading.create({
      data: {
        userId: USER,
        bookId: "book-1",
        number: 1,
        status: "FINISHED",
        endedAt: new Date(Date.UTC(2026, 9, 12)),
      },
    });
    const late = await sendMonthlyDigests(new Date(Date.UTC(2026, 10, 20)));
    expect(late.sent).toBe(0);
    const first = await sendMonthlyDigests(new Date(Date.UTC(2026, 10, 2)));
    expect(first.sent).toBe(1);
    const again = await sendMonthlyDigests(new Date(Date.UTC(2026, 10, 3)));
    expect(again.checked).toBe(0);
    expect(
      (await testDb.user.findUniqueOrThrow({ where: { id: USER } }))
        .lastDigestMonth,
    ).toBe("2026-10");
  });
});
