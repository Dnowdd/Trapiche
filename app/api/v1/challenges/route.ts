import { act, apiRoute } from "@/lib/api/http";
import { num, oneOf, str } from "@/lib/api/write";
import { createChallenge } from "@/lib/actions/challenges";
import { CHALLENGE_KINDS } from "@/lib/challenges";
import { getChallenges } from "@/lib/queries/challenges";

const serialize = (c: Awaited<ReturnType<typeof getChallenges>>[number]) => ({
  id: c.id,
  title: c.title,
  kind: c.kind,
  value: c.value,
  description: c.detail,
  target: c.target,
  done: c.done,
  percent: c.percent,
  complete: c.complete,
  ended: c.ended,
  startsAt: c.startsAt,
  endsAt: c.endsAt,
  books: c.books.map((b) => ({ id: b.id, title: b.title, author: b.author })),
});

export const GET = apiRoute(async ({ userId }) => ({
  data: (await getChallenges(userId)).map(serialize),
}));

export const POST = apiRoute(
  async ({ userId, body }) => {
    const b = await body();
    const created = await act(userId, () =>
      createChallenge({
        title: str(b, "title", true)!,
        kind: oneOf(b, "kind", CHALLENGE_KINDS, true)!,
        value: str(b, "value") ?? null,
        target: num(b, "target", true)!,
        startsAt: str(b, "startsAt", true)!,
        endsAt: str(b, "endsAt", true)!,
      }),
    );
    const all = await getChallenges(userId);
    return { data: serialize(all.find((c) => c.id === created!.id)!) };
  },
  { write: true, status: 201 },
);
