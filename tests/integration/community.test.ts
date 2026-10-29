import { beforeEach, describe, expect, it } from "vitest";
import {
  addReviewComment,
  getReviewComments,
  saveReview,
  toggleReviewLike,
} from "@/lib/actions/reviews";
import {
  reportContent,
  resolveReport,
  restoreContent,
} from "@/lib/actions/reports";
import { setReadingGoal } from "@/lib/actions/goals";
import { addPastReading, finishBook } from "@/lib/actions/shelf";
import { getReviews } from "@/lib/queries/book";
import { getGoal, getRetrospective } from "@/lib/queries/stats";
import { testDb, viewer } from "./setup";

async function addUser(id: string, handle: string, isAdmin = false) {
  const now = new Date();
  await testDb.user.create({
    data: {
      id,
      name: handle,
      email: `${handle}@example.com`,
      emailVerified: true,
      handle,
      isAdmin,
      createdAt: now,
      updatedAt: now,
    },
  });
}

async function reviewByOther() {
  viewer.id = "user-other";
  await saveReview("book-1", {
    rating: 4,
    text: "O final é surpreendente",
    spoiler: true,
  });
  const review = await testDb.review.findFirstOrThrow({
    where: { userId: "user-other" },
  });
  viewer.id = "user-test";
  return review;
}

beforeEach(async () => {
  await addUser("user-other", "outro");
  await addUser("user-admin", "admin", true);
});

describe("notifications", () => {
  it("notifies likes and comments, never yourself, and undoes unlikes", async () => {
    const review = await reviewByOther();
    expect(review.spoiler).toBe(true);
    await toggleReviewLike(review.id);
    await addReviewComment(review.id, "Concordo");
    expect(
      await testDb.notification.findMany({
        where: { userId: "user-other" },
        select: { kind: true, actorId: true },
        orderBy: { createdAt: "asc" },
      }),
    ).toEqual([
      { kind: "REVIEW_LIKED", actorId: "user-test" },
      { kind: "REVIEW_COMMENTED", actorId: "user-test" },
    ]);
    await toggleReviewLike(review.id);
    expect(
      await testDb.notification.count({ where: { kind: "REVIEW_LIKED" } }),
    ).toBe(0);

    viewer.id = "user-other";
    await addReviewComment(review.id, "Valeu");
    expect(
      await testDb.notification.count({ where: { actorId: "user-other" } }),
    ).toBe(0);
  });
});

describe("reports and moderation", () => {
  it("keeps one open report per reporter and blocks self reports", async () => {
    const review = await reviewByOther();
    expect(
      (await reportContent({ reviewId: review.id, reason: "spam" })).ok,
    ).toBe(true);
    expect(
      (await reportContent({ reviewId: review.id, reason: "other" })).ok,
    ).toBe(true);
    expect(await testDb.report.count()).toBe(1);
    viewer.id = "user-other";
    expect(
      (await reportContent({ reviewId: review.id, reason: "spam" })).ok,
    ).toBe(false);
  });

  it("only admins resolve, hiding removes the review from listings", async () => {
    const review = await reviewByOther();
    await reportContent({ reviewId: review.id, reason: "offensive" });
    const report = await testDb.report.findFirstOrThrow();

    expect((await resolveReport(report.id, "hide")).ok).toBe(false);

    viewer.id = "user-admin";
    expect((await resolveReport(report.id, "hide")).ok).toBe(true);
    expect(
      (await testDb.review.findUniqueOrThrow({ where: { id: review.id } }))
        .hiddenAt,
    ).not.toBeNull();
    expect((await testDb.report.findFirstOrThrow()).status).toBe("HIDDEN");
    expect((await getReviews("book-1", null, { take: 10 })).total).toBe(0);

    expect((await restoreContent(report.id)).ok).toBe(true);
    expect(
      (await getReviews("book-1", null, { take: 10 })).items[0].spoiler,
    ).toBe(true);
  });

  it("hides reported comments", async () => {
    const review = await reviewByOther();
    viewer.id = "user-other";
    await addReviewComment(review.id, "spam spam");
    const comment = await testDb.reviewComment.findFirstOrThrow();
    viewer.id = "user-test";
    await reportContent({ commentId: comment.id, reason: "spam" });
    viewer.id = "user-admin";
    await resolveReport((await testDb.report.findFirstOrThrow()).id, "hide");
    expect(await getReviewComments(review.id)).toEqual([]);
  });
});

describe("reading goal and retrospective", () => {
  it("counts finished readings of the year against the goal", async () => {
    expect((await setReadingGoal(2026, 0)).ok).toBe(false);
    expect((await setReadingGoal(2026, 12)).ok).toBe(true);
    await finishBook("book-1", { finishedAt: "2026-03-10" });
    await addPastReading("book-1", { finishedAt: "2025-05-02" });
    const goal = await getGoal("user-test", 2026);
    expect(goal).toMatchObject({ target: 12, done: 1, pct: 8 });
    expect((await setReadingGoal(2026, null)).ok).toBe(true);
    expect((await getGoal("user-test", 2026)).target).toBeNull();
  });

  it("builds monthly and yearly totals", async () => {
    await finishBook("book-1", { finishedAt: "2026-03-10" });
    const reading = await testDb.reading.findFirstOrThrow();
    await testDb.readingSession.create({
      data: {
        userId: "user-test",
        bookId: "book-1",
        readingId: reading.id,
        date: new Date("2026-03-09T00:00:00Z"),
        pages: 120,
        minutes: 90,
        pageEnd: 120,
      },
    });
    await saveReview("book-1", { rating: 4.5, text: "Lindo" });

    const year = await getRetrospective("user-test", 2026);
    expect(year.totals).toMatchObject({
      books: 1,
      pages: 120,
      minutes: 90,
      readingDays: 1,
    });
    expect(year.months![2]).toMatchObject({
      books: 1,
      pages: 120,
      minutes: 90,
    });
    expect(year.months![3].books).toBe(0);
    expect(year.highlights.favorite?.rating).toBe(4.5);
    expect(year.authors).toEqual([{ name: "Carla Madeira", count: 1 }]);

    const march = await getRetrospective("user-test", 2026, 3);
    expect(march.totals.books).toBe(1);
    expect((await getRetrospective("user-test", 2026, 4)).totals.books).toBe(0);
  });

  it("keeps year-only finishes out of the monthly view", async () => {
    await finishBook("book-1", { finishedAt: "2026" });
    expect((await getRetrospective("user-test", 2026)).totals.books).toBe(1);
    expect((await getRetrospective("user-test", 2026, 1)).totals.books).toBe(0);
  });
});
