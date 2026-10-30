import { afterEach, describe, expect, it, vi } from "vitest";

async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v as string);
  return import("@/lib/rate-limit");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("rateLimited", () => {
  it("limits in memory without upstash", async () => {
    const { rateLimited, authRateLimitStorage } = await load({
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
    });
    expect(authRateLimitStorage).toBeUndefined();
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimited("k", 3, 60_000));
    expect(results).toEqual([false, false, false, true]);
  });

  it("counts in upstash and falls back to memory when it fails", async () => {
    let count = 0;
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      expect(body[0][0]).toBe("INCR");
      count += 1;
      return new Response(JSON.stringify([{ result: count }, { result: 1 }]));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { rateLimited, authRateLimitStorage } = await load({
      UPSTASH_REDIS_REST_URL: "https://redis.test",
      UPSTASH_REDIS_REST_TOKEN: "t",
    });
    expect(authRateLimitStorage).toBeDefined();
    expect(await rateLimited("u", 2, 60_000)).toBe(false);
    expect(await rateLimited("u", 2, 60_000)).toBe(false);
    expect(await rateLimited("u", 2, 60_000)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe("https://redis.test/pipeline");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("down", { status: 500 })),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await rateLimited("down", 1, 60_000)).toBe(false);
    expect(await rateLimited("down", 1, 60_000)).toBe(true);
  });
});
