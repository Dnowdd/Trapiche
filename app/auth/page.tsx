import { Suspense } from "react";
import AuthContent from "./_components/auth-content";
import { getFeaturedBooks } from "@/app/catalog";

export default async function AuthPage() {
  const books = await getFeaturedBooks();
  return (
    <Suspense>
      <AuthContent books={books} />
    </Suspense>
  );
}
