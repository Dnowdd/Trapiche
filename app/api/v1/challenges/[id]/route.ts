import { act, ApiError, apiRoute } from "@/lib/api/http";
import { deleteChallenge } from "@/lib/actions/challenges";
import { db } from "@/lib/db";

export const DELETE = apiRoute<{ id: string }>(
  async ({ userId }, { id }) => {
    const exists = await db.challenge.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!exists)
      throw new ApiError(404, "not_found", "Desafio não encontrado.");
    await act(userId, () => deleteChallenge(id));
    return { ok: true };
  },
  { write: true },
);
