const hits = new Map<string, number[]>();

function memoryCount(key: string, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstash(commands: (string | number)[][]) {
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
    signal: AbortSignal.timeout(1500),
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const data = (await res.json()) as { result?: unknown; error?: string }[];
  const failed = data.find((d) => d.error);
  if (failed) throw new Error(failed.error);
  return data.map((d) => d.result);
}

export interface RateLimitResult {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const window = Math.floor(Date.now() / windowMs);
  const resetAt = (window + 1) * windowMs;
  let count: number;
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    count = memoryCount(key, windowMs);
  } else {
    const bucket = `rl:${key}:${window}`;
    try {
      const [n] = await upstash([
        ["INCR", bucket],
        ["PEXPIRE", bucket, windowMs],
      ]);
      count = Number(n);
    } catch (err) {
      console.error("[rate-limit] falling back to memory", err);
      count = memoryCount(key, windowMs);
    }
  }
  return {
    limited: count > limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}

export async function rateLimited(
  key: string,
  limit: number,
  windowMs: number,
) {
  return (await consumeRateLimit(key, limit, windowMs)).limited;
}

interface AuthRateLimit {
  key: string;
  count: number;
  lastRequest: number;
}

export const authRateLimitStorage =
  UPSTASH_URL && UPSTASH_TOKEN
    ? {
        async get(key: string) {
          try {
            const [raw] = await upstash([["GET", `auth-rl:${key}`]]);
            return raw ? (JSON.parse(String(raw)) as AuthRateLimit) : null;
          } catch {
            return null;
          }
        },
        async set(key: string, value: AuthRateLimit) {
          await upstash([
            ["SET", `auth-rl:${key}`, JSON.stringify(value), "EX", 3600],
          ]).catch(() => null);
        },
      }
    : undefined;

export function clientIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
