"use server";

import { refresh } from "next/cache";
import { db } from "../db";
import { fail, withUser } from "./result";

export async function setAdmin(targetId: string, admin: boolean) {
  return withUser(async (userId) => {
    const viewer = await db.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (!viewer?.isAdmin) fail("Só admins podem fazer isso.");
    const target = await db.user.findUnique({
      where: { id: targetId },
      select: { isAdmin: true },
    });
    if (!target) fail("Usuário não encontrado.");
    if (target.isAdmin === admin) return;
    if (!admin) {
      const admins = await db.user.count({ where: { isAdmin: true } });
      if (admins <= 1) fail("O Trapiche precisa ter pelo menos um admin.");
    }
    await db.user.update({ where: { id: targetId }, data: { isAdmin: admin } });
    refresh();
  });
}
