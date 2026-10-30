import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { isAdmin } from "@/lib/queries/reports";
import { getAdminOverview } from "@/lib/queries/admin";
import Avatar from "@/components/shared/avatar";
import SupportShell from "@/components/support/shell";

export const metadata: Metadata = { title: "Painel admin" };

export default async function AdminHome() {
  const session = await requireSession();
  if (!(await isAdmin(session.user.id))) notFound();
  const data = await getAdminOverview();
  const stats = [
    { label: "leitores", value: data.stats.users },
    { label: "novos em 7 dias", value: data.stats.newUsers },
    { label: "ativos em 7 dias", value: data.stats.activeReaders },
    { label: "livros nas estantes", value: data.stats.books },
    { label: "resenhas", value: data.stats.reviews },
  ];
  const queues = [
    {
      href: "/admin/suporte",
      label: "Tickets aguardando resposta",
      value: data.queues.openTickets,
    },
    {
      href: "/admin/denuncias",
      label: "Denúncias abertas",
      value: data.queues.openReports,
    },
  ];

  return (
    <SupportShell eyebrow="Administração" title="Visão geral">
      <div className="grid grid-cols-2 sm:grid-cols-5 rounded-2xl border border-[rgba(67,62,18,0.1)] bg-(--cream-card) overflow-hidden">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`py-4 px-5 border-[rgba(67,62,18,0.08)] ${i > 0 ? "sm:border-l" : ""} ${i % 2 === 1 ? "max-sm:border-l" : ""} ${i >= 2 ? "max-sm:border-t" : ""}`}
          >
            <div className="text-[28px] font-extrabold tracking-[-0.03em] text-(--ink) leading-none tabular-nums">
              {s.value.toLocaleString("pt-BR")}
            </div>
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {queues.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition-colors ${q.value > 0 ? "border-(--yellow-deep) bg-(--yellow-soft) hover:bg-(--yellow)" : "border-[rgba(67,62,18,0.1)] bg-(--cream-card) hover:bg-(--yellow-soft)"}`}
          >
            <span className="text-[14px] font-semibold text-(--ink-2)">
              {q.label}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[24px] font-extrabold text-(--ink) tabular-nums">
                {q.value}
              </span>
              <span aria-hidden className="text-(--ink-3)">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-end justify-between gap-4 mb-3">
        <h2 className="m-0 text-[17px] font-bold text-(--ink)">
          Cadastros recentes
        </h2>
        <Link
          href="/admin/usuarios"
          className="text-[12px] text-(--ink-3) border-b border-(--ink-4) pb-px hover:text-(--ink)"
        >
          Todos os usuários →
        </Link>
      </div>
      <div className="rounded-[18px] border border-[rgba(67,62,18,0.1)] bg-(--cream-card) overflow-hidden">
        {data.recent.map((u) => (
          <Link
            key={u.id}
            href={`/u/${u.handle}`}
            className="flex items-center gap-3 px-5 py-3 border-b border-(--rule) last:border-b-0 hover:bg-(--yellow-soft)"
          >
            <Avatar
              name={u.name}
              image={u.image}
              size={32}
              className="border"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-(--ink) truncate">
                {u.name}
              </div>
              <div className="font-mono text-[10.5px] text-(--ink-4)">
                @{u.handle} · {u.shelf} {u.shelf === 1 ? "livro" : "livros"}
                {!u.emailVerified && " · e-mail não confirmado"}
              </div>
            </div>
            <span className="font-mono text-[10.5px] text-(--ink-4) whitespace-nowrap">
              {u.joined}
            </span>
          </Link>
        ))}
      </div>
    </SupportShell>
  );
}
