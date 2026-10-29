"use client";

import { useState } from "react";

const CLAMP_AT = 520;

export default function Synopsis({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const paragraphs = description.split(/\n+/).filter((p) => p.trim());
  const long = description.length > CLAMP_AT;

  return (
    <div data-screen-label="03 Sinopse">
      <div
        className={[
          "text-[15px] leading-[1.7] text-(--ink-2) text-pretty max-w-170 [&>p]:mb-3 [&>p:last-child]:mb-0",
          long && !expanded ? "line-clamp-6" : "",
        ].join(" ")}
      >
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {long && (
        <button
          type="button"
          className="mt-2.5 text-[13px] font-semibold text-(--ink-2) border-b border-(--ink-4) cursor-pointer hover:border-(--ink-2)"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Ler menos" : "Ler mais"}
        </button>
      )}
    </div>
  );
}
