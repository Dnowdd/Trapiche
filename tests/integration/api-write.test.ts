import { describe, expect, it } from "vitest";
import { becomeDeveloper, createApiKey } from "@/lib/actions/developer";
import * as shelfItem from "@/app/api/v1/shelf/[bookId]/route";
import { POST as finish } from "@/app/api/v1/shelf/[bookId]/finish/route";
import { POST as session } from "@/app/api/v1/shelf/[bookId]/sessions/route";
import { PUT as like } from "@/app/api/v1/shelf/[bookId]/like/route";
import { PUT as bookTags } from "@/app/api/v1/shelf/[bookId]/tags/route";
import { POST as newQuote } from "@/app/api/v1/quotes/route";
import * as quote from "@/app/api/v1/quotes/[id]/route";
import { POST as newTag } from "@/app/api/v1/tags/route";
import { POST as newList } from "@/app/api/v1/lists/route";
import { POST as addItem } from "@/app/api/v1/lists/[id]/items/route";
import * as review from "@/app/api/v1/reviews/[bookId]/route";
import { PUT as setGoal } from "@/app/api/v1/goals/[year]/route";
import { PATCH as patchMe } from "@/app/api/v1/me/route";
import { testDb, viewer } from "./setup";

const BASE = "http://localhost/api/v1";
const BOOK = "book-1";

type Handler = (
  req: Request,
  ctx: { params: Promise<never> },
) => Promise<Response>;

async function call(
  handler: Handler,
  method: string,
  path: string,
  key: string,
  params: Record<string, string> = {},
  body?: unknown,
) {
  const res = await handler(
    new Request(`${BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    { params: Promise.resolve(params) } as { params: Promise<never> },
  );
  return { status: res.status, json: await res.json() };
}

async function key(canWrite: boolean) {
  await becomeDeveloper();
  const res = await createApiKey("app", canWrite);
  if (!res.ok) throw new Error(res.error);
  viewer.id = null;
  return res.data!.key;
}

describe("api writes", () => {
  it("refuses read-only keys", async () => {
    const k = await key(false);
    const res = await call(
      shelfItem.PUT as Handler,
      "PUT",
      `/shelf/${BOOK}`,
      k,
      { bookId: BOOK },
      { status: "WANT" },
    );
    expect(res.status).toBe(403);
    expect(res.json.error.code).toBe("insufficient_scope");
    expect(await testDb.userBook.count()).toBe(0);
  });

  it("drives the reading flow as the key owner", async () => {
    const k = await key(true);
    const p = { bookId: BOOK };
    let res = await call(
      shelfItem.PUT as Handler,
      "PUT",
      `/shelf/${BOOK}`,
      k,
      p,
      { status: "READING", startedAt: "2026-10-01" },
    );
    expect(res.status).toBe(200);
    expect(res.json.data.status).toBe("READING");

    res = await call(
      session as Handler,
      "POST",
      `/shelf/${BOOK}/sessions`,
      k,
      p,
      { date: "2026-10-02", pageEnd: 40, minutes: 30 },
    );
    expect(res.status).toBe(201);
    expect(res.json.data.currentPage).toBe(40);

    res = await call(like as Handler, "PUT", `/shelf/${BOOK}/like`, k, p, {
      liked: true,
    });
    expect(res.json.data.liked).toBe(true);
    res = await call(like as Handler, "PUT", `/shelf/${BOOK}/like`, k, p, {
      liked: true,
    });
    expect(res.json.data.liked).toBe(true);

    res = await call(finish as Handler, "POST", `/shelf/${BOOK}/finish`, k, p, {
      startedAt: "2026-10-01",
      finishedAt: "2026-10-05",
      rating: 4.5,
      review: "Bonito.",
    });
    expect(res.json.data).toMatchObject({ status: "READ", days: 5 });
    res = await call(review.GET as Handler, "GET", `/reviews/${BOOK}`, k, p);
    expect(res.json.data).toMatchObject({ rating: 4.5, text: "Bonito." });

    res = await call(
      shelfItem.DELETE as Handler,
      "DELETE",
      `/shelf/${BOOK}`,
      k,
      p,
    );
    expect(res.json).toEqual({ ok: true });
    expect((await testDb.userBook.findFirst())?.status).toBeNull();
  });

  it("returns validation errors from the shared rules", async () => {
    const k = await key(true);
    const bad = await call(
      shelfItem.PUT as Handler,
      "PUT",
      `/shelf/${BOOK}`,
      k,
      { bookId: BOOK },
      { status: "LIDO" },
    );
    expect(bad.status).toBe(400);
    const rule = await call(
      review.PUT as Handler,
      "PUT",
      `/reviews/${BOOK}`,
      k,
      { bookId: BOOK },
      { rating: 7 },
    );
    expect(rule.status).toBe(422);
    expect(rule.json.error.code).toBe("invalid_request");
    const json = await shelfItem.PUT(
      new Request(`${BASE}/shelf/${BOOK}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${k}` },
        body: "{oops",
      }),
      { params: Promise.resolve({ bookId: BOOK }) },
    );
    expect(json.status).toBe(400);
  });

  it("manages quotes, tags, lists, goals and the profile", async () => {
    const k = await key(true);
    let res = await call(
      newQuote as Handler,
      "POST",
      "/quotes",
      k,
      {},
      { bookId: BOOK, text: "Tudo é rio.", page: 3 },
    );
    expect(res.status).toBe(201);
    const id = res.json.data.id;
    res = await call(
      quote.PATCH as Handler,
      "PATCH",
      `/quotes/${id}`,
      k,
      { id },
      { private: true },
    );
    expect(res.json.data).toMatchObject({
      text: "Tudo é rio.",
      page: 3,
      private: true,
    });

    res = await call(
      newTag as Handler,
      "POST",
      "/tags",
      k,
      {},
      { name: "clube" },
    );
    const tagId = res.json.data.id;
    await call(
      shelfItem.PUT as Handler,
      "PUT",
      `/shelf/${BOOK}`,
      k,
      { bookId: BOOK },
      { status: "WANT" },
    );
    res = await call(
      bookTags as Handler,
      "PUT",
      `/shelf/${BOOK}/tags`,
      k,
      { bookId: BOOK },
      { tagIds: [tagId] },
    );
    expect(res.json.data.tags.map((t: { name: string }) => t.name)).toEqual([
      "clube",
    ]);

    res = await call(
      newList as Handler,
      "POST",
      "/lists",
      k,
      {},
      { title: "Para o verão" },
    );
    expect(res.json.data.visibility).toBe("PUBLIC");
    const listId = res.json.data.id;
    res = await call(
      addItem as Handler,
      "POST",
      `/lists/${listId}/items`,
      k,
      { id: listId },
      { bookId: BOOK },
    );
    expect(res.status).toBe(201);
    expect(await testDb.listItem.count({ where: { listId } })).toBe(1);

    const year = String(new Date().getUTCFullYear());
    res = await call(
      setGoal as Handler,
      "PUT",
      `/goals/${year}`,
      k,
      { year },
      { target: 12 },
    );
    expect(res.json.data.target).toBe(12);

    res = await call(
      patchMe as Handler,
      "PATCH",
      "/me",
      k,
      {},
      {
        bio: "Leio no ônibus.",
        privacy: { profileVisibility: "MEMBERS" },
        notifications: { monthlyDigest: true },
      },
    );
    expect(res.json.data).toMatchObject({
      name: "Leitora Teste",
      bio: "Leio no ônibus.",
      privacy: { profileVisibility: "MEMBERS", showShelf: true },
      notifications: { monthlyDigest: true, inactivityReminder: false },
    });

    res = await call(quote.DELETE as Handler, "DELETE", `/quotes/${id}`, k, {
      id,
    });
    expect(res.json).toEqual({ ok: true });
  });

  it("cannot touch another reader's quote", async () => {
    const now = new Date();
    await testDb.user.create({
      data: {
        id: "u2",
        name: "Outra",
        email: "o@x.com",
        emailVerified: true,
        handle: "outra2",
        createdAt: now,
        updatedAt: now,
      },
    });
    const q = await testDb.quote.create({
      data: { userId: "u2", bookId: BOOK, text: "Dela" },
    });
    const k = await key(true);
    const res = await call(
      quote.DELETE as Handler,
      "DELETE",
      `/quotes/${q.id}`,
      k,
      { id: q.id },
    );
    expect(res.status).toBe(404);
    expect(await testDb.quote.count()).toBe(1);
  });
});
