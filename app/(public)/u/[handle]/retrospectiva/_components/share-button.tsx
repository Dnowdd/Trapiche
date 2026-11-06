"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";
import { shareLink } from "@/components/reading/share";
import { toast } from "@/components/shared/toast";

export default function ShareButton({
  path,
  title,
}: {
  path: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={() => shareLink(path, title)}
      className="h-9 px-4 inline-flex items-center rounded-full bg-(--yellow) text-(--ink) text-[13px] font-semibold cursor-pointer transition-transform duration-150 hover:-translate-y-px"
    >
      Compartilhar
    </button>
  );
}

export function StoryButton({
  src,
  fileName,
  title,
}: {
  src: string;
  fileName: string;
  title: string;
}) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title }).catch((err) => {
          if (!(err instanceof DOMException && err.name === "AbortError"))
            throw err;
        });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast("Imagem baixada. É só postar nos stories.");
    } catch {
      toast("Não deu pra gerar a imagem agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className="h-9 px-4 inline-flex items-center gap-2 rounded-full border border-[rgba(255,248,213,0.35)] text-(--cream) text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-[rgba(255,248,213,0.1)] disabled:opacity-60 disabled:cursor-wait"
    >
      <Smartphone size={15} aria-hidden />
      {busy ? "Gerando imagem…" : "Imagem para stories"}
    </button>
  );
}
