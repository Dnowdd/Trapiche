import { act, apiRoute, badParam } from "@/lib/api/http";
import { setReadingGoal } from "@/lib/actions/goals";
import { getGoal } from "@/lib/queries/stats";

type P = { year: string };

function parseYear(raw: string) {
  const year = Number(raw);
  if (!Number.isInteger(year)) throw badParam("year", "use um ano, ex.: 2026.");
  return year;
}

async function goal(userId: string, year: number) {
  const g = await getGoal(userId, year);
  return { data: { year, target: g?.target ?? null, done: g?.done ?? 0 } };
}

export const GET = apiRoute<P>(({ userId }, { year }) =>
  goal(userId, parseYear(year)),
);

export const PUT = apiRoute<P>(
  async ({ userId, body }, { year }) => {
    const y = parseYear(year);
    const b = await body();
    const target = b.target === null ? null : Number(b.target);
    if (target !== null && !Number.isFinite(target))
      throw badParam("target", "use um número ou null.");
    await act(userId, () => setReadingGoal(y, target));
    return goal(userId, y);
  },
  { write: true },
);
