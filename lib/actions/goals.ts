"use server";

import { refresh } from "next/cache";
import { db } from "../db";
import { today } from "../dates";
import { fail, withUser } from "./result";

export async function setReadingGoal(year: number, target: number | null) {
  return withUser(async (userId) => {
    const current = today().getUTCFullYear();
    if (!Number.isInteger(year) || year < current - 1 || year > current + 1)
      fail("Escolha um ano válido.");
    const key = { userId_year: { userId, year } };
    if (target == null) {
      await db.readingGoal.deleteMany({ where: { userId, year } });
    } else {
      const n = Number(target);
      if (!Number.isInteger(n) || n < 1 || n > 1000)
        fail("A meta precisa ser entre 1 e 1.000 livros.");
      await db.readingGoal.upsert({
        where: key,
        create: { userId, year, target: n },
        update: { target: n },
      });
    }
    refresh();
  });
}
