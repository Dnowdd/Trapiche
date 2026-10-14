import { Suspense } from "react";
import { redirect } from "next/navigation";
import AuthContent from "./_components/auth-content";
import { getFeaturedBooks } from "@/app/catalog";
import { getSession } from "@/lib/session";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token && (await getSession())) redirect("/");

  const books = await getFeaturedBooks();
  return (
    <Suspense>
      <AuthContent books={books} />
    </Suspense>
  );
}
