"use server";

import { refresh } from "next/cache";
import { db } from "../db";
import { fail, withUser } from "./result";

export async function updateProfile(input: {
  name: string;
  handle: string;
  bio?: string;
  city?: string;
}) {
  return withUser(async (userId) => {
    const name = String(input.name ?? "").trim();
    if (!name) fail("Informe seu nome.");
    if (name.length > 60) fail("O nome pode ter no máximo 60 caracteres.");
    const handle = String(input.handle ?? "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();
    if (!/^[a-z0-9_.]{3,30}$/.test(handle))
      fail(
        "O usuário precisa ter de 3 a 30 caracteres: letras, números, ponto ou _.",
      );
    const bio = String(input.bio ?? "").trim();
    if (bio.length > 400) fail("A bio pode ter no máximo 400 caracteres.");
    const city = String(input.city ?? "").trim();
    if (city.length > 60) fail("A cidade pode ter no máximo 60 caracteres.");

    const taken = await db.user.findFirst({
      where: { handle, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) fail(`O usuário @${handle} já está em uso.`);

    await db.user.update({
      where: { id: userId },
      data: { name, handle, bio: bio || null, city: city || null },
    });
    refresh();
    return { handle };
  });
}
