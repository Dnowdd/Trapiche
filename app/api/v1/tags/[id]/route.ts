import { act, apiRoute, ApiError } from "@/lib/api/http";
import { bool, str } from "@/lib/api/write";
import { deleteTag, updateTag } from "@/lib/actions/tags";
import { db } from "@/lib/db";

type P = { id: string };

async function ownTag(userId: string, id: string) {
  const tag = await db.tag.findFirst({
    where: { id, userId },
    select: { id: true, name: true, color: true, private: true },
  });
  if (!tag) throw new ApiError(404, "not_found", "Tag não encontrada.");
  return tag;
}

export const PATCH = apiRoute<P>(
  async ({ userId, body }, { id }) => {
    const current = await ownTag(userId, id);
    const b = await body();
    await act(userId, () =>
      updateTag(id, {
        name: str(b, "name") ?? current.name,
        color: str(b, "color") ?? current.color,
        private: bool(b, "private") ?? current.private,
      }),
    );
    return { data: await ownTag(userId, id) };
  },
  { write: true },
);

export const DELETE = apiRoute<P>(
  async ({ userId }, { id }) => {
    await ownTag(userId, id);
    await act(userId, () => deleteTag(id));
    return { ok: true };
  },
  { write: true },
);
