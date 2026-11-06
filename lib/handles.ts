import { db } from "./db";
import { normalize } from "./editions";

export function handleBase(seed: string) {
  const base = normalize(seed.split("@")[0])
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.{2,}/g, ".")
    .slice(0, 24);
  return base.length >= 3 ? base : `leitor${base}`.slice(0, 24);
}

export async function uniqueHandle(...seeds: (string | null | undefined)[]) {
  const bases = seeds.filter((s): s is string => Boolean(s)).map(handleBase);
  for (const base of bases.length ? bases : ["leitor"]) {
    const taken = await db.user.findUnique({
      where: { handle: base },
      select: { id: true },
    });
    if (!taken) return base;
  }
  const base = bases[0] ?? "leitor";
  for (let i = 0; i < 20; i++) {
    const candidate = `${base.slice(0, 24)}${Math.floor(100 + Math.random() * 9900)}`;
    const taken = await db.user.findUnique({
      where: { handle: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${base.slice(0, 20)}${Date.now().toString(36)}`;
}
