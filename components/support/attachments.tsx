"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "@/components/shared/toast";
import { resizeImage } from "@/lib/client-image";
import { ATTACHMENT_MAX_BYTES, ATTACHMENTS_MAX } from "@/lib/support";
import type { TicketMessage } from "@/lib/queries/support";
import { cn } from "@/lib/utils";

export interface PendingImage {
  key: string;
  blob: Blob;
  width: number;
  height: number;
  preview: string;
}

export function useAttachments() {
  const [items, setItems] = useState<PendingImage[]>([]);
  const [busy, setBusy] = useState(false);
  const urls = useRef<string[]>([]);

  useEffect(
    () => () => urls.current.forEach((u) => URL.revokeObjectURL(u)),
    [],
  );

  const add = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return toast("Escolha arquivos de imagem.");
    const room = ATTACHMENTS_MAX - items.length;
    if (room <= 0)
      return toast(`Dá pra anexar até ${ATTACHMENTS_MAX} imagens.`);
    if (list.length > room)
      toast(`Só cabem mais ${room}. As outras ficaram de fora.`);
    setBusy(true);
    const next: PendingImage[] = [];
    for (const file of list.slice(0, room)) {
      try {
        const r = await resizeImage(file, {
          max: 1600,
          maxBytes: ATTACHMENT_MAX_BYTES,
        });
        const preview = URL.createObjectURL(r.blob);
        urls.current.push(preview);
        next.push({ key: preview, preview, ...r });
      } catch {
        toast(`Não deu pra usar “${file.name}”.`);
      }
    }
    setItems((prev) => [...prev, ...next]);
    setBusy(false);
  };

  const remove = (key: string) =>
    setItems((prev) => prev.filter((i) => i.key !== key));

  const toForm = () => {
    if (!items.length) return undefined;
    const form = new FormData();
    items.forEach((i, n) => {
      form.append("file", i.blob, `imagem-${n + 1}.webp`);
      form.append("width", String(i.width));
      form.append("height", String(i.height));
    });
    return form;
  };

  return { items, busy, add, remove, clear: () => setItems([]), toForm };
}

export function AttachButton({
  onPick,
  disabled,
  count,
}: {
  onPick: (files: FileList) => void;
  disabled?: boolean;
  count: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const full = count >= ATTACHMENTS_MAX;
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onPick(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled || full}
        onClick={() => input.current?.click()}
        aria-label="Anexar imagem"
        title={full ? `Até ${ATTACHMENTS_MAX} imagens` : "Anexar imagem"}
        className="w-11 h-11 shrink-0 rounded-xl border-[1.5px] border-[rgba(67,62,18,0.14)] text-(--ink-3) flex items-center justify-center cursor-pointer hover:bg-(--yellow-soft) hover:text-(--ink-2) disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
        </svg>
      </button>
    </>
  );
}

export function PendingList({
  items,
  onRemove,
  busy,
}: {
  items: PendingImage[];
  onRemove: (key: string) => void;
  busy: boolean;
}) {
  if (!items.length && !busy) return null;
  return (
    <div className="flex gap-2 flex-wrap">
      {items.map((i) => (
        <div
          key={i.key}
          className="relative w-16 h-16 rounded-lg overflow-hidden border border-[rgba(67,62,18,0.15)] bg-(--cream-deep)"
        >
          <Image
            src={i.preview}
            alt="Prévia do anexo"
            fill
            unoptimized
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(i.key)}
            aria-label="Remover imagem"
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-(--ink-2)/85 text-(--cream) text-[12px] leading-none flex items-center justify-center cursor-pointer hover:bg-(--ink)"
          >
            ×
          </button>
        </div>
      ))}
      {busy && (
        <div className="w-16 h-16 rounded-lg border border-dashed border-[rgba(67,62,18,0.25)] flex items-center justify-center">
          <span className="w-4 h-4 rounded-full border-2 border-(--ink-3) border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}

export function MessageImages({
  items,
  mine,
}: {
  items: TicketMessage["attachments"];
  mine: boolean;
}) {
  if (!items.length) return null;
  return (
    <div
      className={cn(
        "mt-1.5 grid gap-1.5",
        items.length === 1 ? "grid-cols-1" : "grid-cols-2",
        mine && "justify-items-end",
      )}
    >
      {items.map((a) => (
        <a
          key={a.id}
          href={a.url}
          target="_blank"
          rel="noopener"
          className="block rounded-xl overflow-hidden border border-[rgba(67,62,18,0.12)] bg-(--cream-deep) hover:opacity-90"
          style={{ maxWidth: items.length === 1 ? 280 : 160 }}
        >
          <Image
            src={a.url}
            alt="Imagem anexada"
            width={a.width}
            height={a.height}
            unoptimized
            className="block w-full h-auto max-h-72 object-cover"
          />
        </a>
      ))}
    </div>
  );
}
