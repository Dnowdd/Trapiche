"use client";

import { useMemo, useRef, useState } from "react";
import { MessageSquare, SquarePen, Trash2 } from "lucide-react";
import ChatView, {
  PilotMark,
  type ComposerHandle,
} from "@/components/assistant/chat-view";
import { useAssistantChat } from "@/components/assistant/use-assistant-chat";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import {
  deleteAllAssistantThreads,
  deleteAssistantThread,
} from "@/lib/actions/assistant";
import { ASSISTANT_NAME } from "@/lib/assistant/config";
import type { ChatMessage } from "@/lib/assistant/types";
import type { ThreadSummary } from "@/lib/queries/assistant";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;

function groupOf(iso: string, now: number) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const t = new Date(iso).getTime();
  if (t >= start.getTime()) return "Hoje";
  if (t >= start.getTime() - DAY) return "Ontem";
  if (t >= start.getTime() - 6 * DAY) return "Nos últimos 7 dias";
  return "Antes";
}

function setUrl(threadId: string | null) {
  window.history.replaceState(
    null,
    "",
    threadId ? `/assistente?c=${threadId}` : "/assistente",
  );
}

export default function AssistantPage({
  firstName,
  threads: initialThreads,
  thread,
  shareData,
}: {
  shareData: boolean;
  firstName: string;
  threads: ThreadSummary[];
  thread: { id: string; title: string; messages: ChatMessage[] } | null;
}) {
  const [threads, setThreads] = useState(initialThreads);
  const [showList, setShowList] = useState(false);
  const [now] = useState(() => Date.now());
  const composer = useRef<ComposerHandle>(null);
  const removing = useAction();
  const chat = useAssistantChat({
    threadId: thread?.id ?? null,
    messages: thread?.messages ?? [],
    shareData,
    onThread: (t) => {
      setUrl(t.id);
      setThreads((prev) => [
        { id: t.id, title: t.title, updatedAt: new Date().toISOString() },
        ...prev.filter((x) => x.id !== t.id),
      ]);
    },
  });

  const groups = useMemo(() => {
    const map = new Map<string, ThreadSummary[]>();
    for (const t of threads) {
      const g = groupOf(t.updatedAt, now);
      map.set(g, [...(map.get(g) ?? []), t]);
    }
    return [...map.entries()];
  }, [threads, now]);

  const startNew = () => {
    chat.reset();
    setUrl(null);
    setShowList(false);
    requestAnimationFrame(() => composer.current?.focus());
  };

  const select = async (id: string) => {
    setShowList(false);
    if (id === chat.threadId) return;
    setUrl(id);
    if (!(await chat.open(id))) {
      toast("Essa conversa não existe mais.");
      setThreads((prev) => prev.filter((t) => t.id !== id));
      setUrl(null);
    }
  };

  const remove = (t: ThreadSummary) => {
    if (!window.confirm(`Apagar a conversa “${t.title}”?`)) return;
    removing.run(
      () => deleteAssistantThread(t.id),
      () => {
        setThreads((prev) => prev.filter((x) => x.id !== t.id));
        if (chat.threadId === t.id) {
          chat.reset();
          setUrl(null);
        }
        toast("Conversa apagada.");
      },
      toast,
    );
  };

  const removeAll = () => {
    if (
      !window.confirm(
        "Apagar todas as conversas com o Prático? Isso não tem volta.",
      )
    )
      return;
    removing.run(
      () => deleteAllAssistantThreads(),
      () => {
        setThreads([]);
        chat.reset();
        setUrl(null);
        toast("Todas as conversas foram apagadas.");
      },
      toast,
    );
  };

  const list = (
    <nav aria-label="Conversas" className="flex flex-col gap-5">
      {groups.map(([label, items]) => (
        <div key={label}>
          <div className="px-2.5 mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
            {label}
          </div>
          <ul className="m-0 p-0 list-none flex flex-col gap-0.5">
            {items.map((t) => {
              const active = t.id === chat.threadId;
              return (
                <li key={t.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => select(t.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "w-full text-left rounded-[10px] py-2 pl-2.5 pr-9 text-[13px] leading-snug cursor-pointer truncate",
                      active
                        ? "bg-(--yellow-soft) font-semibold text-(--ink)"
                        : "text-(--ink-2) hover:bg-[rgba(var(--ink-rgb),0.05)]",
                    )}
                  >
                    {t.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(t)}
                    disabled={removing.pending}
                    aria-label={`Apagar a conversa “${t.title}”`}
                    className="absolute right-1 top-1/2 -translate-y-1/2 size-7 rounded-md flex items-center justify-center text-(--ink-4) hover:text-(--danger) hover:bg-[rgba(var(--ink-rgb),0.06)] cursor-pointer lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="grid lg:grid-cols-[288px_minmax(0,1fr)] lg:h-[calc(100dvh-7.75rem)] min-h-[calc(100dvh-9rem)] lg:min-h-0">
        <aside className="border-b lg:border-b-0 lg:border-r border-(--rule) flex flex-col min-h-0">
          <div className="flex items-center gap-3 px-5 pt-5 pb-4">
            <PilotMark size={38} spinning={chat.streaming} />
            <div className="min-w-0 flex-1">
              <h1 className="m-0 text-[18px] font-extrabold tracking-[-0.01em] text-(--ink) leading-tight">
                {ASSISTANT_NAME}
              </h1>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
                Assistente de leitura
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 flex gap-2">
            <button
              type="button"
              onClick={startNew}
              className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-[10px] bg-(--ink-2) text-(--yellow) text-[13px] font-semibold cursor-pointer transition-[transform,box-shadow] duration-100 hover:-translate-y-px hover:shadow-[0_12px_24px_-14px_rgba(var(--shadow-rgb),0.6)]"
            >
              <SquarePen size={15} aria-hidden />
              Nova conversa
            </button>
            {threads.length > 0 && (
              <button
                type="button"
                onClick={() => setShowList((v) => !v)}
                aria-expanded={showList}
                aria-controls="pratico-threads"
                className="lg:hidden inline-flex items-center gap-1.5 h-10 px-3.5 rounded-[10px] border border-[rgba(var(--ink-rgb),0.2)] text-[13px] font-semibold text-(--ink-2) cursor-pointer hover:bg-(--yellow-soft)"
              >
                <MessageSquare size={15} aria-hidden />
                {threads.length}
                <span className="sr-only">conversas anteriores</span>
              </button>
            )}
          </div>
          <div
            id="pratico-threads"
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-2.5 pb-4",
              showList ? "block" : "hidden lg:block",
            )}
          >
            {threads.length ? (
              list
            ) : (
              <p className="m-0 px-2.5 text-[12.5px] leading-normal text-(--ink-4)">
                Suas conversas aparecem aqui. Só você vê.
              </p>
            )}
          </div>
          {threads.length > 0 && (
            <div
              className={cn(
                "px-5 py-3.5 border-t border-(--rule)",
                showList ? "block" : "hidden lg:block",
              )}
            >
              <button
                type="button"
                onClick={removeAll}
                disabled={removing.pending}
                className="text-[12px] font-medium text-(--ink-4) hover:text-(--danger) underline-offset-2 hover:underline cursor-pointer"
              >
                Apagar todas as conversas
              </button>
            </div>
          )}
        </aside>
        <section
          aria-label="Conversa"
          className="flex min-h-[70dvh] lg:min-h-0 flex-col"
        >
          <ChatView
            chat={chat}
            firstName={firstName}
            onBook={false}
            variant="page"
            composerRef={composer}
          />
        </section>
      </div>
    </div>
  );
}
