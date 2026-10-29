import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getReports, isAdmin } from "@/lib/queries/reports";
import ReportCard from "./report-card";

export const metadata: Metadata = { title: "Denúncias" };

const TABS = [
  { status: "OPEN", label: "Abertas" },
  { status: "HIDDEN", label: "Ocultadas" },
  { status: "DISMISSED", label: "Descartadas" },
] as const;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireSession();
  if (!(await isAdmin(session.user.id))) notFound();
  const { status: raw } = await searchParams;
  const status = TABS.find((t) => t.status === raw)?.status ?? "OPEN";
  const items = await getReports(status);

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="max-w-220 pt-7 md:pt-10 px-4 sm:px-8 lg:px-18.75 pb-12 md:pb-15">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.06em] uppercase">
          Moderação
        </div>
        <h1 className="m-0 mt-2 mb-5 text-[28px] md:text-[36px] font-extrabold tracking-[-0.025em] text-(--ink)">
          Denúncias
        </h1>
        <nav className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <Link
              key={t.status}
              href={`/admin/denuncias?status=${t.status}`}
              aria-current={t.status === status ? "page" : undefined}
              className="h-9 px-4 inline-flex items-center rounded-full border border-[rgba(67,62,18,0.15)] text-[13px] font-semibold text-(--ink-3) hover:bg-(--yellow-soft) aria-[current=page]:bg-(--ink-2) aria-[current=page]:text-(--yellow) aria-[current=page]:border-(--ink-2)"
            >
              {t.label}
            </Link>
          ))}
        </nav>
        {items.length === 0 ? (
          <p className="text-[14px] text-(--ink-3)">
            {status === "OPEN"
              ? "Nenhuma denúncia aberta. Tudo em paz."
              : "Nada por aqui."}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((r) => (
              <ReportCard key={r.id} report={r} status={status} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
