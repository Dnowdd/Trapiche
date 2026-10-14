import Link from "next/link";
import type { ProfileData, Tab } from "@/lib/queries/profile";

const LABELS: Record<Tab, string> = {
  inicio: "Início",
  estante: "Estante",
  diario: "Diário",
  avaliacoes: "Avaliações",
  listas: "Listas",
  curtidas: "Curtidas",
  abandonos: "Abandonos",
  releituras: "Releituras",
};

export default function ProfileTabs({
  handle,
  active,
  counts,
}: {
  handle: string;
  active: Tab;
  counts: ProfileData["counts"];
}) {
  return (
    <div className="px-15 border-b border-[rgba(67,62,18,0.12)]">
      <div className="flex gap-8 overflow-x-auto" role="tablist">
        {(Object.keys(LABELS) as Tab[]).map((t) => (
          <Link
            key={t}
            href={`/u/${handle}?tab=${t}`}
            scroll={false}
            role="tab"
            aria-selected={active === t}
            className="group relative pt-4.5 pb-4 font-mono text-[11px] uppercase tracking-widest text-(--ink-4) flex items-center gap-1.75 whitespace-nowrap transition-colors duration-150 hover:text-(--ink-2) aria-selected:text-(--ink) aria-selected:after:content-[''] aria-selected:after:absolute aria-selected:after:left-0 aria-selected:after:right-0 aria-selected:after:-bottom-px aria-selected:after:h-0.5 aria-selected:after:bg-(--ink-2) aria-selected:after:rounded-sm"
          >
            {LABELS[t]}
            {counts[t] != null && (
              <span className="font-mono text-[10px] text-(--ink-5) bg-[rgba(67,62,18,0.06)] rounded py-px px-1.5 tracking-normal group-aria-selected:bg-(--ink-2) group-aria-selected:text-(--yellow)">
                {counts[t]}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
