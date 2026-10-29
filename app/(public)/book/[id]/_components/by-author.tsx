import Link from "next/link";
import type { BookPageData } from "@/lib/queries/book";
import { SectionHeader } from "./section-header";

export default function ByAuthor({ data }: { data: BookPageData["byAuthor"] }) {
  if (!data) return null;
  return (
    <section
      id="mais-do-autor"
      className="scroll-mt-6"
      data-screen-label="Mais do autor"
    >
      <SectionHeader
        eyebrow="Mesmo autor"
        title={`Mais de ${data.author}`}
        small
      />
      <div className="bg-(--cream-card) border border-[rgba(67,62,18,0.07)] rounded-[14px] px-4">
        {data.items.map((t) => (
          <Link
            href={`/book/${t.id}`}
            className="flex justify-between gap-4 py-2.5 border-b border-(--rule) last:border-b-0 group"
            key={t.id}
          >
            <span className="text-[13px] text-(--ink-2) font-medium group-hover:underline min-w-0 truncate">
              {t.title}
            </span>
            <span className="font-mono text-[11px] text-(--ink-4) shrink-0">
              {t.year ?? "—"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
