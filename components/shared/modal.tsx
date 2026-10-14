"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  width?: number;
}

export default function Modal({
  open,
  onOpenChange,
  eyebrow,
  title,
  description,
  children,
  width = 480,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[rgba(52,54,0,0.35)] backdrop-blur-[2px] transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0" />
        <Dialog.Popup
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 max-h-[calc(100vh-48px)] overflow-y-auto w-[calc(100vw-32px)] rounded-[18px] bg-(--cream) border border-[rgba(67,62,18,0.10)] shadow-[0_30px_80px_-20px_rgba(67,62,18,0.45)] py-7 px-8 outline-none transition-[opacity,transform] duration-150 data-starting-style:opacity-0 data-starting-style:scale-[0.97] data-ending-style:opacity-0 data-ending-style:scale-[0.97]"
          style={{ maxWidth: width }}
        >
          {eyebrow && (
            <div className="font-mono text-[10px] text-(--ink-4) tracking-[0.08em] uppercase mb-1.5">
              {eyebrow}
            </div>
          )}
          <Dialog.Title className="m-0 text-[22px] font-bold tracking-[-0.015em] text-(--ink) leading-tight">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1.5 mb-0 text-[13px] text-(--ink-3) leading-[1.55]">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-5">{children}</div>
          <Dialog.Close
            aria-label="Fechar"
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-(--ink-4) hover:text-(--ink-2) hover:bg-[rgba(67,62,18,0.06)] cursor-pointer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
