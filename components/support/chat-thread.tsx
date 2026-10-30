"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "@/components/shared/avatar";
import { Button } from "@/components/shared/form";
import { toast } from "@/components/shared/toast";
import { useAction } from "@/components/reading/use-action";
import {
  pollTicket,
  sendSupportMessage,
  setTicketClosed,
} from "@/lib/actions/support";
import type { TicketMessage } from "@/lib/queries/support";
import { MESSAGE_MAX, type TicketStatusId } from "@/lib/support";
import { cn } from "@/lib/utils";
import StatusBadge from "./status-badge";
import {
  AttachButton,
  MessageImages,
  PendingList,
  useAttachments,
} from "./attachments";

const POLL_MS = 4000;

export default function ChatThread({
  ticketId,
  initialMessages,
  initialStatus,
  viewerId,
  staffView,
}: {
  ticketId: string;
  initialMessages: TicketMessage[];
  initialStatus: TicketStatusId;
  viewerId: string;
  staffView: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [status, setStatus] = useState(initialStatus);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const closing = useAction();
  const files = useAttachments();
  const list = useRef<HTMLDivElement>(null);
  const latest = useRef(
    initialMessages.at(-1)?.at ?? new Date(0).toISOString(),
  );

  const merge = useCallback((incoming: TicketMessage[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const next = [...prev, ...incoming.filter((m) => !seen.has(m.id))];
      latest.current = next.at(-1)!.at;
      return next;
    });
  }, []);

  const stick = useRef(true);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const toBottom = () => {
      if (stick.current) el.scrollTop = el.scrollHeight;
    };
    const onScroll = () => {
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    const observer = new ResizeObserver(toBottom);
    for (const child of Array.from(el.children)) observer.observe(child);
    el.addEventListener("scroll", onScroll);
    toBottom();
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [messages.length]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await pollTicket(ticketId, latest.current).catch(() => null);
      if (!alive || !res?.ok || !res.data) return;
      merge(res.data.messages);
      if (res.data.status) setStatus(res.data.status);
    };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [ticketId, merge]);

  const send = async () => {
    const body = draft.trim();
    if ((!body && !files.items.length) || sending || files.busy) return;
    setSending(true);
    const res = await sendSupportMessage(ticketId, body, files.toForm()).catch(
      () => null,
    );
    setSending(false);
    if (!res) return toast("Não deu pra enviar. Confira sua conexão.");
    if (!res.ok) return toast(res.error);
    setDraft("");
    files.clear();
    stick.current = true;
    merge([res.data!.message]);
    setStatus(res.data!.status as TicketStatusId);
  };

  const toggleClosed = (closed: boolean) =>
    closing.run(
      () => setTicketClosed(ticketId, closed),
      () => {
        setStatus(closed ? "CLOSED" : staffView ? "OPEN" : status);
        toast(closed ? "Ticket fechado." : "Ticket reaberto.");
      },
      toast,
    );

  return (
    <div className="flex flex-col rounded-[18px] border border-[rgba(67,62,18,0.1)] bg-(--cream-card) overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-[rgba(67,62,18,0.08)]">
        <StatusBadge status={status} staffView={staffView} />
        {status === "CLOSED" ? (
          staffView && (
            <Button
              variant="ghost"
              className="h-8 px-3 text-[12px]"
              loading={closing.pending}
              onClick={() => toggleClosed(false)}
            >
              Reabrir
            </Button>
          )
        ) : (
          <Button
            variant="ghost"
            className="h-8 px-3 text-[12px]"
            loading={closing.pending}
            onClick={() => {
              if (
                staffView ||
                window.confirm(
                  "Fechar esse ticket? Você pode reabrir respondendo.",
                )
              )
                toggleClosed(true);
            }}
          >
            {staffView ? "Fechar ticket" : "Resolvido, pode fechar"}
          </Button>
        )}
      </div>

      <div
        ref={list}
        className="flex flex-col gap-4 px-4 sm:px-6 py-5 max-h-[60vh] min-h-64 overflow-y-auto"
        aria-live="polite"
      >
        {messages.map((m, i) => {
          const mine = m.authorId === viewerId;
          const grouped =
            i > 0 &&
            messages[i - 1].authorId === m.authorId &&
            new Date(m.at).getTime() - new Date(messages[i - 1].at).getTime() <
              5 * 60_000;
          return (
            <div
              key={m.id}
              className={cn(
                "flex gap-2.5 max-w-[88%] sm:max-w-[75%]",
                mine ? "self-end flex-row-reverse" : "self-start",
                grouped && "-mt-2.5",
              )}
            >
              <div className="w-8 shrink-0">
                {!grouped && (
                  <Avatar
                    name={m.staff && !staffView ? "Trapiche" : m.author}
                    image={m.staff && !staffView ? null : m.image}
                    size={32}
                    className="border"
                  />
                )}
              </div>
              <div className={cn("min-w-0", mine && "text-right")}>
                {!grouped && (
                  <div className="mb-1 flex items-baseline gap-2 text-[11px] text-(--ink-4) flex-wrap justify-[inherit]">
                    <span className="font-semibold text-(--ink-2)">
                      {mine
                        ? "Você"
                        : m.staff
                          ? staffView
                            ? m.author
                            : "Suporte do Trapiche"
                          : m.author}
                    </span>
                    {m.staff && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.06em] bg-(--ink-2) text-(--yellow) px-1.5 py-px rounded">
                        equipe
                      </span>
                    )}
                    <span className="font-mono text-[10px]">{m.time}</span>
                  </div>
                )}
                {m.body && (
                  <div
                    className={cn(
                      "inline-block text-left px-3.5 py-2.5 rounded-2xl text-[14px] leading-[1.5] whitespace-pre-wrap wrap-break-word",
                      mine
                        ? "bg-(--ink-2) text-(--cream) rounded-tr-md"
                        : "bg-(--cream) border border-[rgba(67,62,18,0.1)] text-(--ink-2) rounded-tl-md",
                    )}
                  >
                    {m.body}
                  </div>
                )}
                <MessageImages items={m.attachments} mine={mine} />
              </div>
            </div>
          );
        })}
      </div>

      <form
        className="border-t border-[rgba(67,62,18,0.08)] p-3 sm:p-4 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        {status === "CLOSED" && !staffView && (
          <p className="m-0 text-[12px] text-(--ink-4)">
            Esse ticket está fechado. Se mandar uma mensagem, ele é reaberto.
          </p>
        )}
        <PendingList
          items={files.items}
          onRemove={files.remove}
          busy={files.busy}
        />
        <div className="flex gap-2 items-end">
          <AttachButton
            onPick={files.add}
            disabled={files.busy}
            count={files.items.length}
          />
          <textarea
            value={draft}
            maxLength={MESSAGE_MAX}
            rows={2}
            placeholder="Escreva uma mensagem…"
            aria-label="Mensagem"
            onChange={(e) => setDraft(e.target.value)}
            onPaste={(e) => {
              const pasted = Array.from(e.clipboardData.files);
              if (pasted.length) {
                e.preventDefault();
                files.add(pasted);
              }
            }}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                send();
              }
            }}
            className="flex-1 min-h-11 max-h-48 resize-y rounded-xl border-[1.5px] border-[rgba(67,62,18,0.14)] bg-(--cream) px-3.5 py-2.5 text-[14px] text-(--ink-2) leading-normal outline-none focus:border-(--ink-3) focus:bg-white placeholder:text-(--ink-4)"
          />
          <Button
            type="submit"
            loading={sending}
            disabled={(!draft.trim() && !files.items.length) || files.busy}
            className="h-11"
          >
            Enviar
          </Button>
        </div>
        <span className="text-[11px] text-(--ink-5)">
          Enter envia · Shift+Enter quebra a linha · cole ou anexe até 3 imagens
        </span>
      </form>
    </div>
  );
}
