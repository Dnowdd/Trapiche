import { ActionError } from "./action-error";

export const MAX_TAGS = 50;
export const MAX_TAGS_PER_BOOK = 10;
export const TAG_NAME_MAX = 32;

export const TAG_COLORS = [
  "#433e12",
  "#b5522e",
  "#1e3a3a",
  "#2f4a5e",
  "#5b3a1e",
  "#3a1f40",
  "#1f4030",
  "#8a4b22",
] as const;

export function parseTagName(raw: unknown) {
  const name = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^#+\s*/, "");
  if (!name) throw new ActionError("Dê um nome para a tag.");
  if (name.length > TAG_NAME_MAX)
    throw new ActionError(
      `O nome da tag pode ter no máximo ${TAG_NAME_MAX} caracteres.`,
    );
  return name;
}
