import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { actingUserId } from "./actor";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/auth");
  return session;
}

export async function getViewerId() {
  return actingUserId() ?? (await getSession())?.user.id ?? null;
}
