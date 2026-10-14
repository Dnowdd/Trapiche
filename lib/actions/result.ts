import { getViewerId } from "../session";

export type ActionResult<T = void> =
  { ok: true; data?: T } | { ok: false; error: string };

export class ActionError extends Error {}

export function fail(message: string): never {
  throw new ActionError(message);
}

export async function withUser<T>(
  fn: (userId: string) => Promise<T>,
): Promise<ActionResult<T>> {
  const userId = await getViewerId();
  if (!userId)
    return { ok: false, error: "Entre na sua conta para continuar." };
  try {
    const data = await fn(userId);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Algo deu errado. Tente de novo." };
  }
}
