"use server";

import { revalidate } from "../revalidate";
import { db } from "../db";
import { ensureBook } from "../books";
import { fail, throttle, withUser } from "./result";
import { MAX_TAGS, MAX_TAGS_PER_BOOK, parseTagName, TAG_COLORS } from "../tags";

function parseColor(color: unknown) {
  return TAG_COLORS.includes(color as (typeof TAG_COLORS)[number])
    ? (color as string)
    : TAG_COLORS[0];
}

export async function createTag(input: {
  name: string;
  color?: string;
  private?: boolean;
}) {
  return withUser(async (userId) => {
    await throttle(userId, "tag", 40, 3_600_000);
    const name = parseTagName(input.name);
    if ((await db.tag.count({ where: { userId } })) >= MAX_TAGS)
      fail(`Você pode ter até ${MAX_TAGS} tags.`);
    const exists = await db.tag.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" } },
      select: { id: true, name: true, color: true, private: true },
    });
    if (exists) return exists;
    const tag = await db.tag.create({
      data: {
        userId,
        name,
        color: parseColor(input.color),
        private: input.private === true,
      },
      select: { id: true, name: true, color: true, private: true },
    });
    revalidate();
    return tag;
  });
}

export async function updateTag(
  tagId: string,
  input: { name: string; color: string; private: boolean },
) {
  return withUser(async (userId) => {
    const name = parseTagName(input.name);
    const clash = await db.tag.findFirst({
      where: {
        userId,
        name: { equals: name, mode: "insensitive" },
        NOT: { id: tagId },
      },
      select: { id: true },
    });
    if (clash) fail(`Você já tem uma tag chamada “${name}”.`);
    const { count } = await db.tag.updateMany({
      where: { id: tagId, userId },
      data: { name, color: parseColor(input.color), private: input.private },
    });
    if (!count) fail("Essa tag não existe mais.");
    revalidate();
  });
}

export async function deleteTag(tagId: string) {
  return withUser(async (userId) => {
    await db.tag.deleteMany({ where: { id: tagId, userId } });
    revalidate();
  });
}

export async function setBookTags(bookId: string, tagIds: string[]) {
  return withUser(async (userId) => {
    const unique = [...new Set(tagIds)].slice(0, MAX_TAGS_PER_BOOK + 1);
    if (unique.length > MAX_TAGS_PER_BOOK)
      fail(`Um livro pode ter até ${MAX_TAGS_PER_BOOK} tags.`);
    const owned = await db.tag.findMany({
      where: { userId, id: { in: unique } },
      select: { id: true },
    });
    if (owned.length !== unique.length) fail("Tag inválida.");
    await ensureBook(bookId);
    await db.$transaction(async (tx) => {
      const entry = await tx.userBook.upsert({
        where: { userId_bookId: { userId, bookId } },
        create: { userId, bookId },
        update: {},
        select: { id: true },
      });
      await tx.userBookTag.deleteMany({
        where: { userBookId: entry.id, tagId: { notIn: unique } },
      });
      await tx.userBookTag.createMany({
        data: unique.map((tagId) => ({ userBookId: entry.id, tagId })),
        skipDuplicates: true,
      });
    });
    revalidate();
  });
}
