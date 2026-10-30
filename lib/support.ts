export const TICKET_CATEGORIES = {
  ACCOUNT: "Conta e login",
  BUG: "Algo não funciona",
  BOOK_DATA: "Dados de um livro",
  SUGGESTION: "Sugestão",
  OTHER: "Outro assunto",
} as const;

export type TicketCategoryId = keyof typeof TICKET_CATEGORIES;

export const TICKET_STATUS = {
  OPEN: "Aguardando equipe",
  ANSWERED: "Respondido",
  CLOSED: "Fechado",
} as const;

export type TicketStatusId = keyof typeof TICKET_STATUS;

export const SUBJECT_MAX = 120;
export const MESSAGE_MAX = 4000;
export const OPEN_TICKETS_MAX = 5;

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function fmtMessageTime(d: Date) {
  return timeFmt.format(d).replace(".", "");
}

export const ATTACHMENTS_MAX = 3;
export const ATTACHMENT_MAX_BYTES = 1200 * 1024;

export const attachmentUrl = (id: string) => `/api/support/attachments/${id}`;
