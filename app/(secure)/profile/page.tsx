import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";

export default async function MyProfile({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { handle: true },
  });
  if (!user) redirect("/auth");
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams))
    if (typeof v === "string") query.set(k, v);
  const qs = query.toString();
  redirect(`/u/${user.handle}${qs ? `?${qs}` : ""}`);
}
