import { ActionError } from "./action-error";

export const QUOTE_MAX = 1200;
export const QUOTE_NOTE_MAX = 600;

export interface QuoteInput {
  text: string;
  page?: number | string | null;
  note?: string | null;
  private?: boolean;
}

export function parseQuote(input: QuoteInput) {
  const text = String(input.text ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!text) throw new ActionError("Escreva o trecho que você quer guardar.");
  if (text.length > QUOTE_MAX)
    throw new ActionError(
      `A citação pode ter no máximo ${QUOTE_MAX} caracteres.`,
    );
  const note = String(input.note ?? "").trim();
  if (note.length > QUOTE_NOTE_MAX)
    throw new ActionError(
      `A nota pode ter no máximo ${QUOTE_NOTE_MAX} caracteres.`,
    );
  const rawPage = input.page;
  let page: number | null = null;
  if (rawPage !== undefined && rawPage !== null && String(rawPage).trim()) {
    page = Number(rawPage);
    if (!Number.isInteger(page) || page < 1 || page > 20000)
      throw new ActionError("Informe uma página válida.");
  }
  return { text, note: note || null, page, private: input.private === true };
}
