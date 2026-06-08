import { Suspense } from "react";
import AuthContent from "./_components/auth-content";
import { getBooks } from "@/app/catalog";

export default async function AuthPage() {
  const books = await getBooks();
  return (
    <Suspense>
      <AuthContent books={books} />
    </Suspense>
  );
}
