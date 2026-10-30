import { createHash, randomInt } from "node:crypto";

export const KEY_PREFIX = "trp_live_";
export { MAX_ACTIVE_KEYS } from "./limits";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export function generateKey() {
  let secret = "";
  for (let i = 0; i < 32; i++) secret += ALPHABET[randomInt(ALPHABET.length)];
  const key = `${KEY_PREFIX}${secret}`;
  return {
    key,
    prefix: key.slice(0, KEY_PREFIX.length + 6),
    hash: hashKey(key),
  };
}

export function looksLikeKey(value: string) {
  return /^trp_live_[0-9A-Za-z]{32}$/.test(value);
}
