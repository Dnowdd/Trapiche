import { getViewerId } from "../session";
import { ActionError } from "../action-error";
import { rateLimited } from "../rate-limit";

export { ActionError };

export type ActionResult<T = void> =
  { ok: true; data?: T } | { ok: false; error: string };

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

export async function throttle(
  userId: string,
  action: string,
  max: number,
  windowMs: number,
) {
  if (await rateLimited(`action:${action}:${userId}`, max, windowMs))
    fail(
      "Você está indo rápido demais. Espere alguns minutos e tente de novo.",
    );
}
