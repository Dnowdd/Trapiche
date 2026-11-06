"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadAssistantThread,
  setAssistantDataSharing,
} from "@/lib/actions/assistant";
import { toast } from "@/components/shared/toast";
import type {
  ActionCard,
  BookCard,
  ChatMessage,
  StreamEvent,
} from "@/lib/assistant/types";

export interface UiMessage extends ChatMessage {
  streaming?: boolean;
  status?: string | null;
  error?: string | null;
  stopped?: boolean;
  retry?: string;
}

interface Options {
  threadId?: string | null;
  messages?: ChatMessage[];
  bookId?: string | null;
  shareData?: boolean;
  onThread?: (thread: { id: string; title: string }) => void;
}

const tempId = () => `tmp-${Math.random().toString(36).slice(2)}`;

export function useAssistantChat(options: Options = {}) {
  const [threadId, setThreadId] = useState<string | null>(
    options.threadId ?? null,
  );
  const [messages, setMessages] = useState<UiMessage[]>(options.messages ?? []);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [shareData, setShareDataState] = useState(options.shareData ?? false);
  const [savingShare, setSavingShare] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const pendingShare = useRef<Promise<unknown> | null>(null);
  const onThread = useRef(options.onThread);
  const bookId = useRef(options.bookId ?? null);

  useEffect(() => {
    onThread.current = options.onThread;
    bookId.current = options.bookId ?? null;
  });

  useEffect(() => () => controller.current?.abort(), []);

  const patch = useCallback(
    (id: string, fn: (m: UiMessage) => UiMessage) =>
      setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m))),
    [],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || controller.current) return;
      const now = new Date().toISOString();
      let assistantId = tempId();
      setMessages((prev) => [
        ...prev,
        {
          id: tempId(),
          role: "user",
          content: text,
          blocks: [],
          createdAt: now,
        },
        {
          id: assistantId,
          role: "assistant",
          content: "",
          blocks: [],
          createdAt: now,
          streaming: true,
          status: null,
        },
      ]);
      const abort = new AbortController();
      controller.current = abort;
      setStreaming(true);

      let retryable = true;
      const handle = (event: StreamEvent) => {
        switch (event.type) {
          case "thread": {
            const previous = assistantId;
            assistantId = event.messageId;
            patch(previous, (m) => ({ ...m, id: event.messageId }));
            setThreadId(event.threadId);
            onThread.current?.({ id: event.threadId, title: event.title });
            break;
          }
          case "status":
            patch(assistantId, (m) => ({ ...m, status: event.label }));
            break;
          case "delta":
            patch(assistantId, (m) => ({
              ...m,
              status: null,
              content: m.content + event.text,
            }));
            break;
          case "block":
            patch(assistantId, (m) => ({
              ...m,
              blocks: [...m.blocks, event.block],
            }));
            break;
          case "done":
            setRemaining(event.remaining);
            patch(assistantId, (m) => ({
              ...m,
              streaming: false,
              status: null,
            }));
            break;
          case "error":
            patch(assistantId, (m) => ({
              ...m,
              streaming: false,
              status: null,
              error: event.message,
              retry: retryable ? text : undefined,
            }));
            break;
        }
      };

      try {
        await pendingShare.current;
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            threadId,
            bookId: bookId.current,
          }),
          signal: abort.signal,
        });
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          retryable = res.status >= 500 || res.status === 404;
          handle({
            type: "error",
            message: data?.error ?? "Não consegui responder agora.",
          });
          if (res.status === 404) setThreadId(null);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (line) handle(JSON.parse(line) as StreamEvent);
          }
        }
        patch(assistantId, (m) =>
          m.streaming ? { ...m, streaming: false, status: null } : m,
        );
      } catch {
        if (abort.signal.aborted)
          patch(assistantId, (m) => ({
            ...m,
            streaming: false,
            status: null,
            stopped: true,
          }));
        else
          handle({
            type: "error",
            message: "A conexão caiu no meio do caminho. Tente de novo.",
          });
      } finally {
        controller.current = null;
        setStreaming(false);
      }
    },
    [patch, threadId],
  );

  const stop = useCallback(() => controller.current?.abort(), []);

  const retry = useCallback(
    (messageId: string) => {
      const failed = messages.find((m) => m.id === messageId);
      if (!failed?.retry) return;
      const index = messages.findIndex((m) => m.id === messageId);
      setMessages((prev) => prev.slice(0, Math.max(0, index - 1)));
      void send(failed.retry);
    },
    [messages, send],
  );

  const reset = useCallback(() => {
    controller.current?.abort();
    setThreadId(null);
    setMessages([]);
  }, []);

  const open = useCallback(async (id: string) => {
    controller.current?.abort();
    setLoading(true);
    const result = await loadAssistantThread(id);
    setLoading(false);
    if (!result.ok) {
      setThreadId(null);
      setMessages([]);
      return false;
    }
    setThreadId(result.data!.id);
    setMessages(result.data!.messages);
    return true;
  }, []);

  const updateAction = useCallback(
    (messageId: string, action: ActionCard) =>
      patch(messageId, (m) => ({
        ...m,
        blocks: m.blocks.map((b) =>
          b.type === "action" && b.action.id === action.id
            ? { ...b, action }
            : b,
        ),
      })),
    [patch],
  );

  const updateBook = useCallback(
    (bookId: string, change: Partial<BookCard>) =>
      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          blocks: m.blocks.map((b) =>
            b.type === "books"
              ? {
                  ...b,
                  books: b.books.map((x) =>
                    x.id === bookId ? { ...x, ...change } : x,
                  ),
                }
              : b,
          ),
        })),
      ),
    [],
  );

  const setShareData = useCallback(async (enabled: boolean) => {
    setShareDataState(enabled);
    setSavingShare(true);
    const saving = setAssistantDataSharing(enabled);
    pendingShare.current = saving;
    const result = await saving;
    if (pendingShare.current === saving) pendingShare.current = null;
    setSavingShare(false);
    if (!result.ok) {
      setShareDataState(!enabled);
      toast(result.error);
      return;
    }
    toast(
      enabled
        ? "O Prático agora usa os dados da sua conta."
        : "O Prático não usa mais os dados da sua conta.",
    );
  }, []);

  return {
    threadId,
    messages,
    shareData,
    syncShareData: setShareDataState,
    savingShare,
    setShareData,
    streaming,
    loading,
    remaining,
    send,
    stop,
    retry,
    reset,
    open,
    updateAction,
    updateBook,
  };
}

export type AssistantChat = ReturnType<typeof useAssistantChat>;
