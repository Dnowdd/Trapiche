import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { isAdmin } from "@/lib/queries/reports";
import { searchUsers, USERS_PAGE } from "@/lib/queries/admin";
import Avatar from "@/components/shared/avatar";
import SupportShell from "@/components/support/shell";
import AdminToggle from "@/components/admin/admin-toggle";
import { control } from "@/components/shared/form";

export const metadata: Metadata = { title: "Usuários" };

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; p?: string }>;
}) {
  const session = await requireSession();
  if (!(await isAdmin(session.user.id))) notFound();
  const { q = "", p } = await searchParams;
  const page = Math.max(0, Number(p) || 0);
  const { users, total } = await searchUsers(q, page);
  const pages = Math.ceil(total / USERS_PAGE);
  const pageHref = (n: number) =>
    `/admin/usuarios?${new URLSearchParams({ ...(q ? { q } : {}), p: String(n) })}`;

  return (
    <SupportShell eyebrow="Administração" title="Usuários">
      <form className="flex gap-2 mb-5" role="search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, @usuário ou e-mail"
          aria-label="Buscar usuários"
          className={`${control} h-11 flex-1`}
        />
        <button
          type="submit"
          className="h-11 px-5 rounded-[10px] bg-(--ink-2) text-(--yellow) text-[13px] font-semibold cursor-pointer hover:bg-(--ink)"
        >
          Buscar
        </button>
      </form>
      <div className="mb-3 font-mono text-[11px] text-(--ink-4)">
        {total.toLocaleString("pt-BR")} {total === 1 ? "usuário" : "usuários"}
        {q && ` para “${q}”`}
      </div>
      {users.length === 0 ? (
        <p className="text-[14px] text-(--ink-3)">Ninguém encontrado.</p>
      ) : (
        <div className="rounded-[18px] border border-[rgba(67,62,18,0.1)] bg-(--cream-card) overflow-hidden">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5 border-b border-(--rule) last:border-b-0"
            >
              <Link
                href={`/u/${u.handle}`}
                className="flex items-center gap-3 flex-1 min-w-0 group"
              >
                <Avatar
                  name={u.name}
                  image={u.image}
                  size={36}
                  className="border"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-(--ink) truncate group-hover:underline">
                      {u.name}
                    </span>
                    {u.isAdmin && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.06em] bg-(--ink-2) text-(--yellow) px-1.5 py-px rounded">
                        admin
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10.5px] text-(--ink-4) truncate">
                    @{u.handle} · {u.email}
                    {!u.emailVerified && " (não confirmado)"}
                  </div>
                  <div className="font-mono text-[10.5px] text-(--ink-5)">
                    desde {u.joined} · {u.shelf} na estante · {u.reviews}{" "}
                    {u.reviews === 1 ? "resenha" : "resenhas"} · {u.tickets}{" "}
                    {u.tickets === 1 ? "ticket" : "tickets"}
                  </div>
                </div>
              </Link>
              <AdminToggle
                userId={u.id}
                handle={u.handle}
                isAdmin={u.isAdmin}
                self={u.id === session.user.id}
              />
            </div>
          ))}
        </div>
      )}
      {pages > 1 && (
        <div className="mt-5 flex items-center justify-between text-[13px]">
          {page > 0 ? (
            <Link
              href={pageHref(page - 1)}
              className="font-semibold text-(--ink-2) hover:underline"
            >
              ← Anteriores
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-[11px] text-(--ink-4)">
            {page + 1} de {pages}
          </span>
          {page + 1 < pages ? (
            <Link
              href={pageHref(page + 1)}
              className="font-semibold text-(--ink-2) hover:underline"
            >
              Próximos →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </SupportShell>
  );
}
