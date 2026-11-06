import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { assistantEnabled, ASSISTANT_NAME } from "@/lib/assistant/config";
import {
  getAssistantThread,
  getAssistantThreads,
} from "@/lib/queries/assistant";
import AssistantPage from "./_components/assistant-page";

export const metadata: Metadata = {
  title: `${ASSISTANT_NAME}, seu assistente de leitura`,
};

export default async function AssistentePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  if (!assistantEnabled()) notFound();
  const session = await requireSession();
  const { c } = await searchParams;
  const [threads, thread, prefs] = await Promise.all([
    getAssistantThreads(session.user.id),
    c ? getAssistantThread(session.user.id, c) : null,
    db.user.findUnique({
      where: { id: session.user.id },
      select: { assistantShareData: true },
    }),
  ]);
  const name = session.user.name;

  return (
    <AssistantPage
      key={thread?.id ?? "new"}
      firstName={name.split(" ")[0] || name}
      threads={threads}
      thread={thread}
      shareData={prefs?.assistantShareData ?? false}
    />
  );
}
