import { shuffle } from "@/lib/utils";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import AuthContent from "./_components/auth-content";
import { getFeaturedBooks } from "@/app/catalog";
import { getSession } from "@/lib/session";
import { safeNext } from "@/lib/links";
import { googleEnabled } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar ou criar conta",
  description:
    "Entre no Trapiche ou crie sua conta grátis para montar sua estante, seu diário de leituras e suas listas.",
  alternates: { canonical: "/auth" },
  robots: { index: false, follow: true },
};

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
      <AuthContent books={books} googleEnabled={googleEnabled} />
    </Suspense>
  );
}
