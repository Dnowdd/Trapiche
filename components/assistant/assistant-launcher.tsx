"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Maximize2, ShipWheel, SquarePen, X } from "lucide-react";
import { ASSISTANT_NAME } from "@/lib/assistant/config";
import ChatView, { PilotMark, type ComposerHandle } from "./chat-view";
import { useAssistantChat } from "./use-assistant-chat";

const KEY = "trapiche-assistant";

interface Saved {
  open: boolean;
  threadId: string | null;
}

function readSaved(): Saved {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { open: false, threadId: null, ...JSON.parse(raw) };
  } catch {
    return { open: false, threadId: null };
  }
  return { open: false, threadId: null };
}

function writeSaved(saved: Saved) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    return;
  }
}

const iconButton =
  "size-9 rounded-[10px] flex items-center justify-center text-(--ink-3) hover:text-(--ink) hover:bg-[rgba(var(--ink-rgb),0.07)] cursor-pointer";

export default function AssistantLauncher({
  firstName,
  shareData,
}: {
  firstName: string;
  shareData: boolean;
}) {
  const pathname = usePathname();
  const bookId = /^\/book\/([^/?#]+)/.exec(pathname)?.[1] ?? null;
  const hidden = pathname.startsWith("/assistente");
  const [open, setOpen] = useState(false);
  const restored = useRef<string | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const composer = useRef<ComposerHandle>(null);
  const chat = useAssistantChat({ bookId, shareData });
  const { open: openThread, messages, threadId } = chat;

  useEffect(() => {
    const saved = readSaved();
    restored.current = saved.threadId;
    if (!saved.open) return;
    const frame = requestAnimationFrame(() => {
      setOpen(true);
      restored.current = null;
      if (saved.threadId) void openThread(saved.threadId);
    });
    return () => cancelAnimationFrame(frame);
  }, [openThread]);

  useEffect(() => {
    if (!hidden) writeSaved({ open, threadId });
  }, [open, threadId, hidden]);

  const show = useCallback(() => {
    setOpen(true);
    const pending = restored.current;
    restored.current = null;
    if (pending && !messages.length) void openThread(pending);
    requestAnimationFrame(() => composer.current?.focus());
  }, [messages.length, openThread]);

  const hide = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => launcher.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hide]);

  if (hidden) return null;

  const onNavigate = () => {
    if (window.matchMedia("(max-width: 639px)").matches) setOpen(false);
  };

  return (
    <>
      {!open && (
        <button
          ref={launcher}
          type="button"
          onClick={show}
          aria-haspopup="dialog"
          aria-controls="pratico-panel"
          className="group fixed bottom-5 right-5 z-40 flex items-center gap-2.5 h-12 pl-2 pr-4.5 rounded-full bg-(--ink-2) text-(--yellow) shadow-[0_18px_40px_-14px_rgba(var(--shadow-rgb),0.75),0_2px_6px_rgba(var(--shadow-rgb),0.18)] cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 animate-[rise_0.4s_cubic-bezier(0.2,0.8,0.2,1)]"
        >
          <span className="size-8 rounded-full bg-(--yellow) text-(--ink-2) flex items-center justify-center">
            <ShipWheel
              size={18}
              strokeWidth={1.9}
              aria-hidden
              className="transition-transform duration-700 ease-out group-hover:rotate-180"
            />
          </span>
          <span className="text-[13.5px] font-semibold text-(--cream)">
            Pergunte ao {ASSISTANT_NAME}
          </span>
        </button>
      )}

      {open && (
        <div
          id="pratico-panel"
          role="dialog"
          aria-label={`${ASSISTANT_NAME}, assistente de leitura`}
          className="fixed inset-0 z-50 flex flex-col bg-(--cream) sm:inset-auto sm:bottom-4 sm:right-4 sm:top-4 sm:w-110 sm:rounded-[22px] sm:border sm:border-[rgba(var(--ink-rgb),0.1)] shadow-[0_32px_80px_-24px_rgba(var(--shadow-rgb),0.55),0_2px_10px_rgba(var(--shadow-rgb),0.1)] origin-bottom-right animate-[panelIn_0.28s_cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden"
        >
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-(--rule) pl-4 pr-2.5">
            <PilotMark size={34} spinning={chat.streaming} />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold leading-tight text-(--ink)">
                {ASSISTANT_NAME}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
                {chat.streaming ? "Escrevendo…" : "Assistente de leitura"}
              </div>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  chat.reset();
                  requestAnimationFrame(() => composer.current?.focus());
                }}
                aria-label="Nova conversa"
                title="Nova conversa"
                className={iconButton}
              >
                <SquarePen size={16} aria-hidden />
              </button>
            )}
            <Link
              href={threadId ? `/assistente?c=${threadId}` : "/assistente"}
              onClick={() => setOpen(false)}
              aria-label="Abrir em tela cheia"
              title="Abrir em tela cheia"
              className={iconButton}
            >
              <Maximize2 size={15} aria-hidden />
            </Link>
            <button
              type="button"
              onClick={hide}
              aria-label="Fechar"
              title="Fechar"
              className={iconButton}
            >
              <X size={18} aria-hidden />
            </button>
          </div>
          <ChatView
            chat={chat}
            firstName={firstName}
            onBook={Boolean(bookId)}
            variant="panel"
            onNavigate={onNavigate}
            composerRef={composer}
          />
        </div>
      )}
    </>
  );
}
