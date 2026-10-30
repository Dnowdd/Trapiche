"use client";

import { useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Avatar from "@/components/shared/avatar";
import { cn } from "@/lib/utils";
import { toast } from "@/components/shared/toast";
import { removeAvatar, uploadAvatar } from "@/lib/actions/profile";
import { authClient } from "@/lib/auth-client";

const SIZE = 400;

async function toSquareWebp(file: File) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(SIZE, side);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86),
  );
  if (!blob) throw new Error("encode");
  return blob;
}

const itemCls =
  "gap-2.5 cursor-pointer px-3 py-2 text-[13px] text-(--ink-2) rounded-[8px] focus:bg-[rgba(67,62,18,0.06)] focus:text-(--ink-2)";

export default function AvatarEditor({
  name,
  image,
  size,
  className,
}: {
  name: string;
  image: string | null;
  size: number;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const done = (message: string) => {
    authClient.$store.notify("$sessionSignal");
    toast(message);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Escolha um arquivo de imagem.");
      return;
    }
    setBusy(true);
    try {
      const blob = await toSquareWebp(file).catch(() => {
        throw new Error("Não deu pra ler essa imagem. Tente outra.");
      });
      const form = new FormData();
      form.set("file", blob, "avatar.webp");
      const res = await uploadAvatar(form);
      if (!res.ok) throw new Error(res.error);
      done("Foto atualizada.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    const res = await removeAvatar();
    setBusy(false);
    if (!res.ok) toast(res.error);
    else done("Foto removida.");
  };

  return (
    <div className="relative shrink-0 group/avatar">
      <Avatar
        name={name}
        image={image}
        size={size}
        className={cn(className, busy && "opacity-50")}
      />
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={busy}
          aria-label="Alterar foto"
          className="absolute -bottom-0.5 -right-0.5 w-9 h-9 rounded-full bg-(--ink-2) text-(--yellow) border-[3px] border-(--cream) flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-105 disabled:cursor-wait"
        >
          {busy ? (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-(--yellow) border-t-transparent animate-spin" />
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="min-w-48 p-1.5 rounded-[12px] bg-(--cream) border border-[rgba(67,62,18,0.10)] shadow-[0_16px_40px_-8px_rgba(67,62,18,0.22)]"
        >
          <DropdownMenuItem
            className={itemCls}
            onClick={() => input.current?.click()}
          >
            {image ? "Trocar foto" : "Enviar foto"}
          </DropdownMenuItem>
          {image && (
            <DropdownMenuItem
              variant="destructive"
              className="gap-2.5 cursor-pointer px-3 py-2 text-[13px] rounded-[8px] focus:bg-red-50"
              onClick={remove}
            >
              Remover foto
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
