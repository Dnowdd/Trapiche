import { unstable_cache } from "next/cache";

export const OPEN_DATA_TTL = 60 * 60 * 24 * 30;
export const GOOGLE_TTL = 60 * 60 * 24;
const EMPTY_TTL_MS = 30 * 60_000;
const FAILURE_TTL_MS = 2 * 60_000;

const negative = new Map<string, number>();

function cacheKey(url: string) {
  const key = new URL(url);
  key.searchParams.delete("key");
  return key.toString();
}

function remember(key: string, ttl: number) {
  if (negative.size > 5000) negative.clear();
  negative.set(key, Date.now() + ttl);
}

export function markUnavailable(url: string) {
  remember(cacheKey(url), FAILURE_TTL_MS);
}

class Uncacheable extends Error {}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function runCached<T>(
  key: string[],
  load: () => Promise<T>,
  ttl: number,
) {
  try {
    return await unstable_cache(load, ["external-api", String(ttl), ...key], {
      revalidate: ttl,
    })();
  } catch (err) {
    if (err instanceof Error && /incrementalCache/i.test(err.message))
      return load();
    throw err;
  }
}

export async function cachedJson<T>(
  url: string,
  init: RequestInit = {},
  accept: (data: T) => boolean = () => true,
  ttl = OPEN_DATA_TTL,
): Promise<T | null> {
  const key = cacheKey(url);
  if ((negative.get(key) ?? 0) > Date.now()) return null;
  try {
    return await runCached(
      [key],
      async () => {
        const res = await fetch(url, { ...init, cache: "no-store" });
        if (!res.ok)
          throw new HttpError(res.status, `${res.status} for ${key}`);
        const data = (await res.json()) as T;
        if (!accept(data)) throw new Uncacheable(key);
        return data;
      },
      ttl,
    );
  } catch (err) {
    if (err instanceof Uncacheable) {
      remember(key, EMPTY_TTL_MS);
      return null;
    }
    throw err;
  }
}

export async function cachedValue<T>(
  key: string,
  load: () => Promise<T | null>,
  ttl = OPEN_DATA_TTL,
): Promise<T | null> {
  try {
    return await runCached(
      [key],
      async () => {
        const value = await load();
        if (value == null) throw new Uncacheable(key);
        return value;
      },
      ttl,
    );
  } catch (err) {
    if (err instanceof Uncacheable) return null;
    throw err;
  }
}
