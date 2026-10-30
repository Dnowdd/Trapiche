"use server";

import { refresh } from "next/cache";
import { db } from "../db";
import { fail, withUser } from "./result";
import { generateKey, MAX_ACTIVE_KEYS } from "../api/keys";

export async function becomeDeveloper() {
  return withUser(async (userId) => {
    await db.user.updateMany({
      where: { id: userId, developerSince: null },
      data: { developerSince: new Date() },
    });
    refresh();
  });
}

export async function createApiKey(rawName: string) {
  return withUser(async (userId) => {
    const name = String(rawName ?? "").trim();
    if (!name) fail("Dê um nome pra chave.");
    if (name.length > 60) fail("O nome pode ter no máximo 60 caracteres.");
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { developerSince: true },
    });
    if (!user?.developerSince)
      fail("Ative o acesso de desenvolvedor primeiro.");
    const active = await db.apiKey.count({
      where: { userId, revokedAt: null },
    });
    if (active >= MAX_ACTIVE_KEYS)
      fail(`Você já tem ${MAX_ACTIVE_KEYS} chaves ativas. Revogue uma antes.`);
    const { key, prefix, hash } = generateKey();
    await db.apiKey.create({ data: { userId, name, prefix, hash } });
    refresh();
    return { key };
  });
}

export async function revokeApiKey(id: string) {
  return withUser(async (userId) => {
    const { count } = await db.apiKey.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (!count) fail("Chave não encontrada.");
    refresh();
  });
}
