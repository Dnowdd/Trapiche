import { beforeAll, describe, expect, it } from "vitest";
import { unsubscribeUrl, verifyUnsubscribe } from "@/lib/unsubscribe";

beforeAll(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret";
  process.env.NEXT_PUBLIC_APP_URL = "https://trapiche.test";
});

const paramsOf = (url: string) => new URL(url).searchParams;

describe("unsubscribe links", () => {
  it("round-trips a signed link", () => {
    const url = unsubscribeUrl("user-1", "digest");
    expect(url.startsWith("https://trapiche.test/api/email/unsubscribe?")).toBe(
      true,
    );
    expect(verifyUnsubscribe(paramsOf(url))).toEqual({
      userId: "user-1",
      kind: "digest",
    });
  });

  it("rejects tampered links", () => {
    const params = paramsOf(unsubscribeUrl("user-1", "digest"));
    params.set("u", "user-2");
    expect(verifyUnsubscribe(params)).toBeNull();
    const other = paramsOf(unsubscribeUrl("user-1", "digest"));
    other.set("k", "reminder");
    expect(verifyUnsubscribe(other)).toBeNull();
    expect(
      verifyUnsubscribe(new URLSearchParams("u=x&k=digest&t=abc")),
    ).toBeNull();
  });
});
