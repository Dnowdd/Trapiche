"use server";

import { refresh } from "next/cache";
import { db } from "../db";
import { fail, withUser } from "./result";
import { imageType } from "../image-type";

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

export async function deleteAccount(confirmHandle: string) {
  return withUser(async (userId) => {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { handle: true },
    });
    if (!user) fail("Conta não encontrada.");
    if (confirmHandle.trim().replace(/^@/, "") !== user.handle)
      fail("Digite seu @ exatamente para confirmar.");
    await db.user.delete({ where: { id: userId } });
  });
}

const AVATAR_MAX_BYTES = 512 * 1024;

export async function uploadAvatar(form: FormData) {
  return withUser(async (userId) => {
    const file = form.get("file");
    if (!(file instanceof Blob) || file.size === 0) fail("Escolha uma imagem.");
    if (file.size > AVATAR_MAX_BYTES) fail("A imagem ficou grande demais.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mimeType = imageType(bytes);
    if (!mimeType) fail("Use uma imagem JPG, PNG ou WebP.");

    const avatar = await db.userAvatar.upsert({
      where: { userId },
      create: { userId, data: bytes, mimeType },
      update: { data: bytes, mimeType },
      select: { updatedAt: true },
    });
    const image = `/api/avatars/${userId}?v=${avatar.updatedAt.getTime()}`;
    await db.user.update({ where: { id: userId }, data: { image } });
    refresh();
    return { image };
  });
}

export async function removeAvatar() {
  return withUser(async (userId) => {
    await db.userAvatar.deleteMany({ where: { userId } });
    await db.user.update({ where: { id: userId }, data: { image: null } });
    refresh();
  });
}
