"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowUp,
  BookOpen,
  BookmarkPlus,
  ChartNoAxesColumn,
  Check,
  CircleAlert,
  Copy,
  Hourglass,
  PenLine,
  RotateCcw,
  Scale,
  ShipWheel,
  Shuffle,
  Sparkles,
  Square,
  type LucideIcon,
} from "lucide-react";
import { ASSISTANT_NAME, MAX_MESSAGE_CHARS } from "@/lib/assistant/config";
import { plainText } from "@/lib/assistant/markdown";
import type { Block } from "@/lib/assistant/types";
import { cn } from "@/lib/utils";
import RichText from "./rich-text";
import { ActionCardView, BookStrip } from "./blocks";
import type { AssistantChat, UiMessage } from "./use-assistant-chat";

export function PilotMark({
  size = 32,
  spinning = false,
  className,
}: {
  size?: number;
  spinning?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "shrink-0 rounded-full bg-(--ink-2) text-(--yellow) flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <ShipWheel
        size={Math.round(size * 0.56)}
        strokeWidth={1.9}
        className={cn(spinning && "animate-[spin_2.6s_linear_infinite]")}
      />
    </span>
  );
}

interface Suggestion {
  icon: LucideIcon;
  label: string;
  prompt: string;
}

const GENERAL: Suggestion[] = [
  {
    icon: Sparkles,
    label: "O que eu leio depois?",
    prompt: "Olhando o que eu li e gostei, o que você me recomenda ler depois?",
  },
  {
    icon: ChartNoAxesColumn,
    label: "Como está meu ano de leitura?",
    prompt:
      "Como está meu ano de leitura? Quero os números e o que se destacou.",
  },
  {
    icon: Hourglass,
    label: "Um livro curto para o fim de semana",
    prompt:
      "Me sugere livros curtos, de até 200 páginas, para ler neste fim de semana.",
  },
  {
    icon: PenLine,
    label: "Me ajuda com uma resenha",
    prompt:
      "Quero escrever a resenha de um livro que terminei. Me ajuda com perguntas?",
  },
];

const GENERAL_PRIVATE: Suggestion[] = [
  {
    icon: Sparkles,
    label: "Romances brasileiros para começar",
    prompt: "Me indica romances brasileiros contemporâneos para começar.",
  },
  {
    icon: BookOpen,
    label: "Clássicos que não assustam",
    prompt:
      "Quais clássicos são bons para quem está começando a ler clássicos?",
  },
  GENERAL[2],
  GENERAL[3],
];

const ON_BOOK: Suggestion[] = [
  {
    icon: BookOpen,
    label: "Me conta sobre este livro",
    prompt: "Me conta sobre este livro, sem spoilers.",
  },
  {
    icon: Scale,
    label: "Vale a pena pra mim?",
    prompt: "Pelo que eu costumo ler e avaliar, este livro combina comigo?",
  },
  {
    icon: Shuffle,
    label: "Livros parecidos com este",
    prompt: "Quais livros parecidos com este você me indica?",
  },
  {
    icon: BookmarkPlus,
    label: "Colocar na minha pilha",
    prompt: "Coloca este livro no meu Quero ler.",
  },
];

function ConsentBox({
  checked,
  disabled,
  onChange,
  small = false,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
  small?: boolean;
}) {
  return (
    <span
      className={cn("relative block shrink-0", small ? "size-3.5" : "size-4.5")}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(
          "peer absolute inset-0 m-0 appearance-none border-[1.5px] border-[rgba(var(--ink-rgb),0.4)] bg-(--cream-card) cursor-pointer transition-colors checked:border-(--ink-2) checked:bg-(--ink-2) disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ink-2)",
          small ? "rounded-[4px]" : "rounded-[5px]",
        )}
      />
      <Check
        aria-hidden
        strokeWidth={3.2}
        className="pointer-events-none absolute inset-0 m-auto size-[72%] text-(--cream) opacity-0 peer-checked:opacity-100"
      />
    </span>
  );
}

function SharingCard({ chat }: { chat: AssistantChat }) {
  return (
    <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-[14px] border border-dashed border-[rgba(var(--ink-rgb),0.22)] px-3.5 py-3 transition-colors hover:border-[rgba(var(--ink-rgb),0.4)]">
      <span className="mt-0.5">
        <ConsentBox
          checked={chat.shareData}
          disabled={chat.savingShare}
          onChange={chat.setShareData}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold leading-snug text-(--ink-2)">
          Usar os dados da minha conta
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-normal text-(--ink-4)">
          {chat.shareData
            ? "Ele vê sua estante, notas, citações, metas e estatísticas para recomendar e responder sobre você. Desmarque quando quiser."
            : "Opcional. Marcando, ele passa a ver sua estante, notas, citações, metas e estatísticas. Desmarcado, só fala de livros em geral."}
        </span>
      </span>
    </label>
  );
}

function EmptyState({
  chat,
  firstName,
  onBook,
  compact,
  onPick,
  onNavigate,
}: {
  chat: AssistantChat;
  firstName: string;
  onBook: boolean;
  compact: boolean;
  onPick: (prompt: string) => void;
  onNavigate?: () => void;
}) {
  const suggestions = onBook
    ? chat.shareData
      ? ON_BOOK
      : ON_BOOK.map((x) =>
          x.icon === Scale
            ? {
                icon: Scale,
                label: "Para quem é este livro?",
                prompt: "Para que tipo de leitor este livro é indicado?",
              }
            : x,
        )
    : chat.shareData
      ? GENERAL
      : GENERAL_PRIVATE;
  return (
    <div
      className={cn(
        "flex flex-col animate-[rise_0.4s_cubic-bezier(0.2,0.8,0.2,1)]",
        compact ? "pt-6" : "pt-10 sm:pt-16 max-w-xl mx-auto w-full",
      )}
    >
      <div className="relative w-fit">
        <span
          aria-hidden
          className="absolute -inset-2 rounded-full border border-[rgba(var(--ink-rgb),0.1)]"
        />
        <span
          aria-hidden
          className="absolute -inset-4 rounded-full border border-[rgba(var(--ink-rgb),0.06)]"
        />
        <PilotMark size={compact ? 48 : 56} />
      </div>
      <h2
        className={cn(
          "m-0 mt-7 font-extrabold tracking-[-0.02em] text-(--ink)",
          compact ? "text-[22px]" : "text-[28px]",
        )}
      >
        Oi, {firstName}.
      </h2>
      <p className="m-0 mt-1.5 text-[14px] leading-relaxed text-(--ink-3) max-w-md">
        Sou o {ASSISTANT_NAME}. Te ajudo a escolher a próxima leitura, lembrar o
        que você leu e manter o diário em dia. Nada muda na sua conta sem você
        confirmar.
      </p>
      <SharingCard chat={chat} />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.prompt)}
            className="group flex items-center gap-3 rounded-[14px] border border-[rgba(var(--ink-rgb),0.12)] bg-(--cream-card) px-3.5 py-3 text-left cursor-pointer transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-px hover:border-[rgba(var(--ink-rgb),0.28)] hover:shadow-[0_12px_24px_-18px_rgba(var(--shadow-rgb),0.6)]"
          >
            <span className="size-8 shrink-0 rounded-[10px] bg-(--yellow) text-(--on-accent) flex items-center justify-center transition-transform duration-200 group-hover:rotate-[-6deg]">
              <s.icon size={15} aria-hidden />
            </span>
            <span className="text-[13px] font-semibold leading-snug text-(--ink-2)">
              {s.label}
            </span>
          </button>
        ))}
      </div>
      <p className="m-0 mt-4 text-[11.5px] leading-normal text-(--ink-4)">
        O {ASSISTANT_NAME} usa a OpenAI e pode errar.{" "}
        <Link
          prefetch={false}
          href="/privacidade#assistente"
          onClick={onNavigate}
          className="underline underline-offset-2 hover:text-(--ink-2)"
        >
          Como seus dados são usados
        </Link>
      </p>
    </div>
  );
}

function StatusLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px]" role="status">
      <span className="bg-[linear-gradient(90deg,var(--ink-4)_0%,var(--ink-4)_35%,var(--ink)_50%,var(--ink-4)_65%,var(--ink-4)_100%)] bg-size-[200%_100%] bg-clip-text text-transparent font-medium animate-[shine_1.8s_linear_infinite]">
        {label}
      </span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(plainText(text));
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex w-fit items-center gap-1.5 h-7 px-2 -ml-2 rounded-md text-[11.5px] font-medium text-(--ink-4) hover:text-(--ink-2) hover:bg-[rgba(var(--ink-rgb),0.06)] cursor-pointer opacity-0 transition-opacity duration-150 group-hover/msg:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
    >
      {copied ? (
        <Check size={13} aria-hidden />
      ) : (
        <Copy size={13} aria-hidden />
      )}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

function segments(content: string, blocks: Block[]) {
  const out: (
    | { kind: "text"; text: string }
    | { kind: "block"; block: Block; index: number }
  )[] = [];
  let cursor = 0;
  const placed = blocks
    .map((block, index) => ({ block, index, at: block.at ?? content.length }))
    .sort((a, b) => a.at - b.at || a.index - b.index);
  for (const p of placed) {
    const at = Math.min(Math.max(p.at, cursor), content.length);
    const text = content.slice(cursor, at).trim();
    if (text) out.push({ kind: "text", text });
    out.push({ kind: "block", block: p.block, index: p.index });
    cursor = at;
  }
  const tail = content.slice(cursor).trim();
  if (tail) out.push({ kind: "text", text: tail });
  return out;
}

function AssistantMessage({
  m,
  chat,
  onNavigate,
}: {
  m: UiMessage;
  chat: AssistantChat;
  onNavigate?: () => void;
}) {
  const parts = segments(m.content, m.blocks);
  const bookIds = new Set(
    m.blocks.flatMap((b) =>
      b.type === "books"
        ? b.books.map((x) => x.id)
        : b.action.book
          ? [b.action.book.id]
          : [],
    ),
  );
  const working = m.streaming && (Boolean(m.status) || !m.content);
  return (
    <div className="group/msg flex gap-3">
      <PilotMark size={28} spinning={m.streaming} className="mt-0.5" />
      <div className="min-w-0 flex-1 flex flex-col gap-3.5">
        {parts.map((p, i) =>
          p.kind === "text" ? (
            <RichText
              key={`t${i}`}
              text={p.text}
              onNavigate={onNavigate}
              bookIds={bookIds}
            />
          ) : p.block.type === "books" ? (
            <BookStrip
              key={`b${p.index}`}
              title={p.block.title}
              books={p.block.books}
              onNavigate={onNavigate}
              onShelved={(id) => chat.updateBook(id, { status: "WANT" })}
            />
          ) : (
            <ActionCardView
              key={p.block.action.id}
              action={p.block.action}
              messageId={m.id}
              locked={Boolean(m.streaming) || m.id.startsWith("tmp-")}
              onChange={(a) => chat.updateAction(m.id, a)}
              onNavigate={onNavigate}
            />
          ),
        )}
        {working && <StatusLine label={m.status ?? "Pensando…"} />}
        {m.stopped && (
          <p className="m-0 text-[12.5px] italic text-(--ink-4)">
            Você interrompeu a resposta.
          </p>
        )}
        {m.error && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[12px] border border-[rgba(154,74,42,0.25)] bg-[rgba(154,74,42,0.05)] px-3.5 py-2.5 text-[13px] text-(--danger)"
          >
            <span className="flex items-start gap-2">
              <CircleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
              {m.error}
            </span>
            {m.retry && !chat.streaming && (
              <button
                type="button"
                onClick={() => chat.retry(m.id)}
                className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-[3px] cursor-pointer"
              >
                <RotateCcw size={13} aria-hidden />
                Tentar de novo
              </button>
            )}
          </div>
        )}
        {!m.streaming && m.content && !m.error && (
          <CopyButton text={m.content} />
        )}
      </div>
    </div>
  );
}

export interface ComposerHandle {
  focus: () => void;
}

export const Composer = forwardRef<
  ComposerHandle,
  {
    chat: AssistantChat;
    onSend: (text: string) => void;
    footer?: ReactNode;
  }
>(function Composer({ chat, onSend, footer }, ref) {
  const [value, setValue] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({ focus: () => area.current?.focus() }));

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || chat.streaming) return;
    onSend(text);
    setValue("");
  };

  const near = value.length > MAX_MESSAGE_CHARS - 200;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex items-end gap-2 rounded-[18px] border-[1.5px] border-[rgba(var(--ink-rgb),0.14)] bg-(--cream-card) p-1.5 pl-4 transition-[border-color,box-shadow] duration-150 focus-within:border-(--ink-3) focus-within:shadow-[0_0_0_4px_rgba(var(--ink-rgb),0.06)]">
        <label htmlFor="pratico-input" className="sr-only">
          Mensagem para o {ASSISTANT_NAME}
        </label>
        <textarea
          id="pratico-input"
          ref={area}
          rows={1}
          value={value}
          maxLength={MAX_MESSAGE_CHARS}
          placeholder="Pergunte sobre livros e leituras…"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              submit();
            }
          }}
          className="flex-1 min-w-0 resize-none bg-transparent py-2 text-[16px] sm:text-[14px] leading-normal text-(--ink-2) outline-none placeholder:text-(--ink-4) focus-visible:outline-none"
        />
        {chat.streaming ? (
          <button
            type="button"
            onClick={chat.stop}
            aria-label="Parar a resposta"
            className="size-9 shrink-0 rounded-full bg-(--ink-2) text-(--yellow) flex items-center justify-center cursor-pointer hover:bg-(--ink)"
          >
            <Square size={12} fill="currentColor" aria-hidden />
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Enviar"
            disabled={!value.trim()}
            className="size-9 shrink-0 rounded-full bg-(--ink-2) text-(--yellow) flex items-center justify-center cursor-pointer transition-opacity hover:bg-(--ink) disabled:opacity-35 disabled:cursor-default"
          >
            <ArrowUp size={17} strokeWidth={2.4} aria-hidden />
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3 text-center text-[11px] leading-snug text-(--ink-4)">
        {near ? (
          <span className="tabular-nums">
            {value.length.toLocaleString("pt-BR")} de{" "}
            {MAX_MESSAGE_CHARS.toLocaleString("pt-BR")} caracteres
          </span>
        ) : (
          footer
        )}
      </div>
    </form>
  );
});

export default function ChatView({
  chat,
  firstName,
  onBook,
  variant,
  onNavigate,
  composerRef,
}: {
  chat: AssistantChat;
  firstName: string;
  onBook: boolean;
  variant: "panel" | "page";
  onNavigate?: () => void;
  composerRef?: React.Ref<ComposerHandle>;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const compact = variant === "panel";

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [chat.messages]);

  useEffect(() => {
    stick.current = true;
  }, [chat.threadId]);

  const send = (text: string) => {
    stick.current = true;
    void chat.send(text);
  };

  const remaining =
    chat.remaining != null && chat.remaining <= 5
      ? chat.remaining === 0
        ? "Esta foi a última mensagem de hoje."
        : `Restam ${chat.remaining} ${chat.remaining === 1 ? "mensagem" : "mensagens"} hoje.`
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
        }}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          compact ? "px-4 sm:px-5" : "px-4 sm:px-8",
        )}
      >
        {chat.loading ? (
          <div className="flex h-full items-center justify-center py-16">
            <StatusLine label="Abrindo a conversa…" />
          </div>
        ) : chat.messages.length === 0 ? (
          <EmptyState
            chat={chat}
            onNavigate={onNavigate}
            firstName={firstName}
            onBook={onBook}
            compact={compact}
            onPick={send}
          />
        ) : (
          <div
            role="log"
            aria-label={`Conversa com o ${ASSISTANT_NAME}`}
            aria-busy={chat.streaming}
            className={cn(
              "flex flex-col gap-6 py-5",
              !compact && "max-w-3xl mx-auto w-full py-8",
            )}
          >
            {chat.messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-[18px] rounded-br-[6px] bg-(--ink-2) text-(--cream) px-4 py-2.5 text-[14px] leading-normal whitespace-pre-wrap [overflow-wrap:anywhere] animate-[rise_0.25s_ease-out]">
                    {m.content}
                  </div>
                </div>
              ) : (
                <AssistantMessage
                  key={m.id}
                  m={m}
                  chat={chat}
                  onNavigate={onNavigate}
                />
              ),
            )}
          </div>
        )}
      </div>
      <div
        className={cn(
          "shrink-0 pt-2 pb-3",
          compact ? "px-3 sm:px-4" : "px-4 sm:px-8 pb-5",
        )}
      >
        <div className={cn(!compact && "max-w-3xl mx-auto")}>
          <Composer
            ref={composerRef}
            chat={chat}
            onSend={send}
            footer={
              chat.messages.length === 0 ? (
                remaining
              ) : (
                <span className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-(--ink-3) hover:text-(--ink-2)">
                    <ConsentBox
                      small
                      checked={chat.shareData}
                      disabled={chat.savingShare}
                      onChange={chat.setShareData}
                    />
                    Usar os dados da minha conta
                  </label>
                  <span>
                    {remaining ?? `O ${ASSISTANT_NAME} pode errar.`}{" "}
                    <Link
                      prefetch={false}
                      href="/privacidade#assistente"
                      onClick={onNavigate}
                      className="underline underline-offset-2 hover:text-(--ink-2)"
                    >
                      Privacidade
                    </Link>
                  </span>
                </span>
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
