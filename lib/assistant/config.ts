export const ASSISTANT_NAME = "Prático";

export const DAILY_MESSAGE_LIMIT = 40;
export const BURST_LIMIT = 8;
export const MAX_TOOL_ROUNDS = 6;
export const MAX_MESSAGE_CHARS = 2000;
export const HISTORY_MESSAGES = 14;

export function assistantEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function assistantModel() {
  return process.env.OPENAI_MODEL || "gpt-6-luna";
}

export function reasoningEffort() {
  const raw = process.env.OPENAI_REASONING_EFFORT || "low";
  return raw === "off" ? null : raw;
}
