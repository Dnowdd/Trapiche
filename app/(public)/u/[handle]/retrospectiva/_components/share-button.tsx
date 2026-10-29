"use client";

import { shareLink } from "@/components/reading/share";

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
