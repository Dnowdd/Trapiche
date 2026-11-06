import { createHmac, timingSafeEqual } from "node:crypto";
import { appUrl } from "./emails/layout";

export const EMAIL_KINDS = ["digest", "reminder"] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number];

function secret() {
  const s = process.env.BETTER_AUTH_SECRET;
  if (!s) throw new Error("BETTER_AUTH_SECRET is required for email links");
  return s;
}

function sign(userId: string, kind: EmailKind) {
  return createHmac("sha256", secret())
    .update(`unsubscribe:${userId}:${kind}`)
    .digest("base64url");
}

export function unsubscribeUrl(userId: string, kind: EmailKind) {
  const params = new URLSearchParams({
    u: userId,
    k: kind,
    t: sign(userId, kind),
  });
  return appUrl(`/api/email/unsubscribe?${params}`);
}

export function verifyUnsubscribe(params: URLSearchParams) {
  const userId = params.get("u") ?? "";
  const kind = params.get("k") as EmailKind;
  const token = params.get("t") ?? "";
  if (!userId || !EMAIL_KINDS.includes(kind)) return null;
  const expected = Buffer.from(sign(userId, kind));
  const given = Buffer.from(token);
  if (expected.length !== given.length || !timingSafeEqual(expected, given))
    return null;
  return { userId, kind };
}
