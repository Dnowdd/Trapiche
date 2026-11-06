"use client";

import { shareLink } from "@/components/reading/share";

export default function ShareQuote({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={() => shareLink(`/citacao/${id}`, `Citação de ${title}`)}
      className="h-9 px-3.5 rounded-[10px] bg-(--ink-2) text-(--yellow) text-[12.5px] font-semibold cursor-pointer hover:bg-(--ink)"
    >
      Compartilhar
    </button>
  );
}
