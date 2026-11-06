export const CHALLENGE_KINDS = [
  "ANY",
  "TAG",
  "AUTHOR",
  "LANGUAGE",
  "FORMAT",
  "LONG",
  "SHORT",
] as const;
export type ChallengeKindId = (typeof CHALLENGE_KINDS)[number];

export const LONG_PAGES = 400;
export const SHORT_PAGES = 200;
export const MAX_CHALLENGES = 20;

export const LANGUAGES: Record<string, string> = {
  pt: "português",
  en: "inglês",
  es: "espanhol",
  fr: "francês",
};

export const FORMATS: Record<string, string> = {
  PRINT: "livro físico",
  EBOOK: "e-book",
  AUDIO: "audiolivro",
};

export function describeChallenge(
  kind: ChallengeKindId,
  value: string | null,
  tagName?: string | null,
) {
  switch (kind) {
    case "TAG":
      return `com a tag “${tagName ?? "removida"}”`;
    case "AUTHOR":
      return `de ${value}`;
    case "LANGUAGE":
      return `em ${LANGUAGES[value ?? ""] ?? value}`;
    case "FORMAT":
      return `em ${FORMATS[value ?? ""] ?? value}`;
    case "LONG":
      return `com ${LONG_PAGES}+ páginas`;
    case "SHORT":
      return `de até ${SHORT_PAGES} páginas`;
    default:
      return "de qualquer tipo";
  }
}
