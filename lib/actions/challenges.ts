"use server";

import { db } from "../db";
import { revalidate } from "../revalidate";
import { fail, throttle, withUser } from "./result";
import {
  CHALLENGE_KINDS,
  FORMATS,
  LANGUAGES,
  MAX_CHALLENGES,
  type ChallengeKindId,
} from "../challenges";

export interface ChallengeInput {
  title: string;
  kind: ChallengeKindId;
  value?: string | null;
  target: number | string;
  startsAt: string;
  endsAt: string;
}

const day = (raw: string, label: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw ?? ""))
    fail(`Data inválida em ${label}.`);
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) fail(`Data inválida em ${label}.`);
  return d;
};

export async function createChallenge(input: ChallengeInput) {
  return withUser(async (userId) => {
    await throttle(userId, "challenge", 30, 3_600_000);
    if (!CHALLENGE_KINDS.includes(input.kind))
      fail("Tipo de desafio inválido.");
    const title = String(input.title ?? "").trim();
    if (!title) fail("Dê um nome para o desafio.");
    if (title.length > 80) fail("O nome pode ter no máximo 80 caracteres.");
    const target = Number(input.target);
    if (!Number.isInteger(target) || target < 1 || target > 500)
      fail("A meta precisa ser entre 1 e 500 livros.");
    const startsAt = day(input.startsAt, "início");
    const endsAt = day(input.endsAt, "fim");
    if (endsAt < startsAt) fail("O fim precisa ser depois do início.");
    if (endsAt.getTime() - startsAt.getTime() > 3 * 366 * 86_400_000)
      fail("O desafio pode durar no máximo 3 anos.");
    let value: string | null = null;
    if (input.kind === "TAG") {
      const tag = await db.tag.findFirst({
        where: { id: String(input.value ?? ""), userId },
        select: { id: true },
      });
      if (!tag) fail("Escolha uma das suas tags.");
      value = tag.id;
    } else if (input.kind === "AUTHOR") {
      value = String(input.value ?? "").trim();
      if (!value || value.length > 120) fail("Informe o nome do autor.");
    } else if (input.kind === "LANGUAGE") {
      value = String(input.value ?? "");
      if (!(value in LANGUAGES)) fail("Escolha um idioma.");
    } else if (input.kind === "FORMAT") {
      value = String(input.value ?? "");
      if (!(value in FORMATS)) fail("Escolha um formato.");
    }
    if ((await db.challenge.count({ where: { userId } })) >= MAX_CHALLENGES)
      fail(`Você pode ter até ${MAX_CHALLENGES} desafios.`);
    const challenge = await db.challenge.create({
      data: {
        userId,
        title,
        kind: input.kind,
        value,
        target,
        startsAt,
        endsAt,
      },
      select: { id: true },
    });
    revalidate();
    return challenge;
  });
}

export async function deleteChallenge(id: string) {
  return withUser(async (userId) => {
    await db.challenge.deleteMany({ where: { id, userId } });
    revalidate();
  });
}
