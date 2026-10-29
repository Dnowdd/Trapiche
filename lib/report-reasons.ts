export const REPORT_REASONS = {
  spoiler: "Spoiler sem aviso",
  offensive: "Ofensivo ou discurso de ódio",
  spam: "Spam ou propaganda",
  other: "Outro motivo",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;
