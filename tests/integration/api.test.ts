import { beforeEach, describe, expect, it } from "vitest";
import {
  becomeDeveloper,
  createApiKey,
  revokeApiKey,
} from "@/lib/actions/developer";
import { GET as me } from "@/app/api/v1/me/route";
import { GET as shelf } from "@/app/api/v1/shelf/route";
import { GET as readings } from "@/app/api/v1/readings/route";
import { GET as lists } from "@/app/api/v1/lists/route";
import { GET as list } from "@/app/api/v1/lists/[id]/route";
import { GET as items } from "@/app/api/v1/lists/[id]/items/route";
import { testDb, viewer } from "./setup";

const BASE = "http://localhost/api/v1";

function call(
  handler: (req: Request, ctx: { params: Promise<never> }) => Promise<Response>,
  path: string,
  key?: string,
  params: Record<string, string> = {},
) {
  return handler(
    new Request(`${BASE}${path}`, {
      headers: key ? { Authorization: `Bearer ${key}` } : {},
    }),
    { params: Promise.resolve(params) } as { params: Promise<never> },
  );
}

async function newKey() {
  await becomeDeveloper();
  const res = await createApiKey("teste");
  if (!res.ok) throw new Error(res.error);
  return res.data!.key;
}

beforeEach(async () => {
  const now = new Date();
  await testDb.user.create({
    data: {
      id: "user-other",
      name: "Outra",
      email: "outra@example.com",
      emailVerified: true,
      handle: "outra",
      createdAt: now,
      updatedAt: now,
    },
  });
  for (let i = 0; i < 25; i++)
    await testDb.book.create({
      data: {
        id: i % 2 ? `OL${i}M` : `g-${i}`,
        title: `Livro ${String(i).padStart(2, "0")}`,
        authors: ["Autora"],
        pageCount: 100,
        publisher: "Editora",
        coverUrl: "https://covers.example/x.jpg",
      },
    });
  for (let i = 0; i < 25; i++)
    await testDb.userBook.create({
      data: {
        userId: "user-test",
        bookId: i % 2 ? `OL${i}M` : `g-${i}`,
        status: i < 5 ? "READING" : "READ",
        statusChangedAt: new Date(Date.now() - i * 1000),
        liked: i === 3,
      },
    });
});

describe("developer api", () => {
  it("requires a valid, active key from a developer", async () => {
    expect((await call(me, "/me")).status).toBe(401);
    expect((await call(me, "/me", "trp_live_" + "x".repeat(32))).status).toBe(
      401,
    );
    expect((await createApiKey("antes")).ok).toBe(false);

    const key = await newKey();
    const ok = await call(me, "/me", key);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("X-RateLimit-Limit")).toBe("60");
    const body = await ok.json();
    expect(body.data).toMatchObject({ handle: "teste" });
    expect(body.data.shelf).toEqual({ READING: 5, READ: 20 });
    expect(JSON.stringify(body)).not.toContain("email");

    const stored = await testDb.apiKey.findFirstOrThrow({});
    expect(stored.hash).not.toBe(key);
    expect(stored.lastUsedAt).not.toBeNull();

    viewer.id = "user-other";
    expect((await revokeApiKey(stored.id)).ok).toBe(false);
    viewer.id = "user-test";
    expect((await revokeApiKey(stored.id)).ok).toBe(true);
    expect((await call(me, "/me", key)).status).toBe(401);
  });

  it("paginates and filters the shelf", async () => {
    const key = await newKey();
    const res = await call(shelf, "/shelf?per_page=10&page=3", key);
    const body = await res.json();
    expect(body.pagination).toEqual({
      page: 3,
      perPage: 10,
      totalPages: 3,
      totalItems: 25,
    });
    expect(body.data).toHaveLength(5);

    const reading = await (
      await call(shelf, "/shelf?status=reading", key)
    ).json();
    expect(reading.pagination.totalItems).toBe(5);
    const liked = await (await call(shelf, "/shelf?liked=true", key)).json();
    expect(liked.data.map((d: { book: { id: string } }) => d.book.id)).toEqual([
      "OL3M",
    ]);
    const search = await (await call(shelf, "/shelf?q=livro 07", key)).json();
    expect(search.pagination.totalItems).toBe(1);

    const google = body.data.find(
      (d: { book: { source: string } }) => d.book.source === "google_books",
    ).book;
    expect(google).not.toHaveProperty("coverUrl");
    expect(google).not.toHaveProperty("publisher");
    const open = body.data.find(
      (d: { book: { source: string } }) => d.book.source === "open_library",
    ).book;
    expect(open.coverUrl).toBe("https://covers.example/x.jpg");

    for (const bad of [
      "/shelf?per_page=500",
      "/shelf?page=0",
      "/shelf?page=abc",
      "/shelf?status=LIDO",
      "/shelf?liked=sim",
      "/shelf?sort=random",
    ]) {
      const r = await call(shelf, bad, key);
      expect(r.status).toBe(400);
      expect((await r.json()).error.code).toBe("invalid_parameter");
    }
  });

  it("returns readings with partial dates and filters by year", async () => {
    const key = await newKey();
    await testDb.reading.create({
      data: {
        userId: "user-test",
        bookId: "OL1M",
        number: 1,
        status: "FINISHED",
        startedAt: new Date(Date.UTC(2025, 4, 1)),
        startPrecision: "MONTH",
        endedAt: new Date(Date.UTC(2025, 11, 20)),
      },
    });
    const body = await (
      await call(readings, "/readings?status=FINISHED&year=2025", key)
    ).json();
    expect(body.pagination.totalItems).toBe(1);
    expect(body.data[0]).toMatchObject({
      startedAt: "2025-05",
      endedAt: "2025-12-20",
    });
    expect(
      (await (await call(readings, "/readings?year=2024", key)).json())
        .pagination.totalItems,
    ).toBe(0);
  });

  it("only shows lists the key owner can see", async () => {
    const key = await newKey();
    const mine = await testDb.list.create({
      data: {
        ownerId: "user-test",
        title: "Minha privada",
        visibility: "PRIVATE",
        members: { create: { userId: "user-test", role: "OWNER" } },
        items: { create: { bookId: "OL1M", addedById: "user-test" } },
      },
    });
    const hidden = await testDb.list.create({
      data: {
        ownerId: "user-other",
        title: "Secreta",
        visibility: "PRIVATE",
        members: { create: { userId: "user-other", role: "OWNER" } },
      },
    });
    const open = await testDb.list.create({
      data: {
        ownerId: "user-other",
        title: "Pública",
        visibility: "PUBLIC",
        members: { create: { userId: "user-other", role: "OWNER" } },
      },
    });

    const all = await (await call(lists, "/lists", key)).json();
    expect(all.data.map((l: { id: string }) => l.id)).toEqual([mine.id]);
    expect(
      (await call(list, `/lists/${open.id}`, key, { id: open.id })).status,
    ).toBe(200);
    expect(
      (await call(list, `/lists/${hidden.id}`, key, { id: hidden.id })).status,
    ).toBe(404);
    expect(
      (await call(items, `/lists/${hidden.id}/items`, key, { id: hidden.id }))
        .status,
    ).toBe(404);
    const its = await (
      await call(items, `/lists/${mine.id}/items`, key, { id: mine.id })
    ).json();
    expect(its.pagination.totalItems).toBe(1);
    expect(its.data[0]).toMatchObject({ addedBy: "teste" });
  });

  it("rate limits each key", async () => {
    const key = await newKey();
    let last: Response | null = null;
    for (let i = 0; i < 61; i++) last = await call(me, "/me", key);
    expect(last!.status).toBe(429);
    expect(last!.headers.get("Retry-After")).not.toBeNull();
    expect((await last!.json()).error.code).toBe("rate_limited");
  });
});
