import { describe, expect, it } from "vitest";
import { generateKey, hashKey, looksLikeKey } from "@/lib/api/keys";

describe("api keys", () => {
  it("generates unique, well-formed keys and stores only a hash", () => {
    const a = generateKey();
    const b = generateKey();
    expect(a.key).not.toBe(b.key);
    expect(looksLikeKey(a.key)).toBe(true);
    expect(a.prefix).toBe(a.key.slice(0, 15));
    expect(a.hash).toBe(hashKey(a.key));
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.hash).not.toContain(a.key.slice(9));
  });

  it("rejects malformed keys", () => {
    for (const bad of [
      "",
      "trp_live_short",
      "trp_test_" + "a".repeat(32),
      "x".repeat(41),
    ])
      expect(looksLikeKey(bad)).toBe(false);
  });
});
