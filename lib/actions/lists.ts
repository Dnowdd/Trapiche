"use server";

import { refresh } from "next/cache";
import { db } from "../db";
import { ensureBook } from "../books";
import { fail, withUser } from "./result";
import type { ListVisibility } from "../generated/prisma/client";

const VISIBILITIES: ListVisibility[] = ["PUBLIC", "PRIVATE", "SHARED"];

function parseListInput(input: {
  title: string;
  note?: string;
  visibility: string;
}) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) fail("Dê um nome para a lista.");
  if (title.length > 80) fail("O nome pode ter no máximo 80 caracteres.");
  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note.length > 300) fail("A descrição pode ter no máximo 300 caracteres.");
  if (!VISIBILITIES.includes(input.visibility as ListVisibility))
    fail("Escolha a visibilidade da lista.");
  return {
    title,
    note: note || null,
    visibility: input.visibility as ListVisibility,
  };
}

async function membership(listId: string, userId: string) {
  const list = await db.list.findUnique({
    where: { id: listId },
    include: { members: { where: { userId } } },
  });
  if (!list) fail("Essa lista não existe mais.");
  return { list, member: list.members[0] ?? null };
}

async function requireOwner(listId: string, userId: string) {
  const { list } = await membership(listId, userId);
  if (list.ownerId !== userId) fail("Só quem criou a lista pode fazer isso.");
  return list;
}

export async function createList(input: {
  title: string;
  note?: string;
  visibility: string;
}) {
  return withUser(async (userId) => {
    const data = parseListInput(input);
    const list = await db.$transaction(async (tx) => {
      const list = await tx.list.create({
        data: {
          ...data,
          ownerId: userId,
          members: { create: { userId, role: "OWNER" } },
        },
      });
      await tx.activity.create({
        data: { userId, listId: list.id, kind: "LIST_CREATED" },
      });
      return list;
    });
    refresh();
    return { id: list.id };
  });
}

export async function updateList(
  listId: string,
  input: { title: string; note?: string; visibility: string },
) {
  return withUser(async (userId) => {
    const data = parseListInput(input);
    const list = await requireOwner(listId, userId);
    await db.$transaction(async (tx) => {
      await tx.list.update({ where: { id: listId }, data });
      if (list.visibility === "SHARED" && data.visibility !== "SHARED") {
        await tx.listMember.deleteMany({
          where: { listId, role: "EDITOR" },
        });
      }
      if (data.visibility !== "PUBLIC") {
        await tx.listFollow.deleteMany({ where: { listId } });
      }
    });
    refresh();
  });
}

export async function deleteList(listId: string) {
  return withUser(async (userId) => {
    await requireOwner(listId, userId);
    await db.list.delete({ where: { id: listId } });
  });
}

export async function addBookToList(listId: string, bookId: string) {
  return withUser(async (userId) => {
    const { list, member } = await membership(listId, userId);
    if (!member) fail("Você não pode editar essa lista.");
    await ensureBook(bookId);
    const exists = await db.listItem.findUnique({
      where: { listId_bookId: { listId, bookId } },
    });
    if (exists) return;
    await db.$transaction([
      db.listItem.create({ data: { listId, bookId, addedById: userId } }),
      db.list.update({
        where: { id: list.id },
        data: { updatedAt: new Date() },
      }),
      db.activity.create({
        data: { userId, bookId, listId, kind: "ADDED_TO_LIST" },
      }),
    ]);
    refresh();
  });
}

export async function removeBookFromList(listId: string, bookId: string) {
  return withUser(async (userId) => {
    const { member } = await membership(listId, userId);
    if (!member) fail("Você não pode editar essa lista.");
    await db.$transaction([
      db.listItem.deleteMany({ where: { listId, bookId } }),
      db.activity.deleteMany({
        where: { listId, bookId, kind: "ADDED_TO_LIST" },
      }),
      db.list.update({
        where: { id: listId },
        data: { updatedAt: new Date() },
      }),
    ]);
    refresh();
  });
}

export async function toggleListPin(listId: string) {
  return withUser(async (userId) => {
    const { member } = await membership(listId, userId);
    if (!member) fail("Só dá para fixar listas que são suas.");
    await db.listMember.update({
      where: { listId_userId: { listId, userId } },
      data: { pinned: !member.pinned },
    });
    refresh();
    return { pinned: !member.pinned };
  });
}

export async function toggleListFollow(listId: string) {
  return withUser(async (userId) => {
    const { list, member } = await membership(listId, userId);
    if (member) fail("Você já faz parte dessa lista.");
    if (list.visibility !== "PUBLIC")
      fail("Só dá para seguir listas públicas.");
    const key = { listId_userId: { listId, userId } };
    const following = await db.listFollow.findUnique({ where: key });
    if (following) await db.listFollow.delete({ where: key });
    else await db.listFollow.create({ data: { listId, userId } });
    refresh();
    return { following: !following };
  });
}

export async function addCollaborator(listId: string, handle: string) {
  return withUser(async (userId) => {
    const list = await requireOwner(listId, userId);
    if (list.visibility !== "SHARED")
      fail("Mude a lista para compartilhada para convidar pessoas.");
    const clean = String(handle ?? "")
      .trim()
      .replace(/^@/, "");
    if (!clean) fail("Informe o @ da pessoa.");
    const user = await db.user.findUnique({
      where: { handle: clean },
      select: { id: true },
    });
    if (!user) fail(`Não encontramos ninguém com o usuário @${clean}.`);
    if (user.id === userId) fail("Você já é dono dessa lista.");
    await db.$transaction([
      db.listMember.upsert({
        where: { listId_userId: { listId, userId: user.id } },
        create: { listId, userId: user.id, role: "EDITOR" },
        update: {},
      }),
      db.listFollow.deleteMany({ where: { listId, userId: user.id } }),
    ]);
    refresh();
  });
}

export async function removeCollaborator(listId: string, memberId: string) {
  return withUser(async (userId) => {
    const { list } = await membership(listId, userId);
    if (list.ownerId !== userId && memberId !== userId)
      fail("Só quem criou a lista pode remover pessoas.");
    if (memberId === list.ownerId)
      fail("O dono não pode sair da própria lista.");
    await db.listMember.deleteMany({
      where: { listId, userId: memberId, role: "EDITOR" },
    });
    refresh();
  });
}

export async function leaveList(listId: string) {
  return withUser(async (userId) => {
    const { list, member } = await membership(listId, userId);
    if (!member) return;
    if (list.ownerId === userId) fail("O dono não pode sair da própria lista.");
    await db.listMember.delete({
      where: { listId_userId: { listId, userId } },
    });
  });
}
