import { shuffle } from "@/lib/utils";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import AuthContent from "./_components/auth-content";
import { getFeaturedBooks } from "@/app/catalog";
import { getSession } from "@/lib/session";
import { safeNext } from "@/lib/links";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>;
}) {
  const { token, next } = await searchParams;
  if (!token && (await getSession())) redirect(safeNext(next) ?? "/");

  const books = shuffle(await getFeaturedBooks());
  return (
    <Suspense>
      <AuthContent books={books} />
    </Suspense>
  );
}
