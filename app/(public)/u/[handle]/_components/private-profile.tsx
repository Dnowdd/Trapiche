import Link from "next/link";
import Avatar from "@/components/shared/avatar";
import { loginHref } from "@/lib/links";
import type { ProfileData } from "@/lib/queries/profile";

export default function PrivateProfile({ profile }: { profile: ProfileData }) {
  const u = profile.user;
  const members = profile.access.blockedBy === "members";

  return (
    <section className="relative px-4 sm:px-8 py-16 md:py-24 flex flex-col items-center text-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-(--yellow-soft) to-transparent pointer-events-none"
      />
      <div className="relative">
        <Avatar
          name={u.name}
          image={u.image}
          size={104}
          className="ring-6 ring-(--cream) shadow-[0_18px_40px_-20px_rgba(var(--shadow-rgb),0.55)]"
        />
        <span className="absolute -bottom-1 -right-1 size-9 rounded-full bg-(--ink-2) text-(--yellow) flex items-center justify-center ring-4 ring-(--cream)">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
            <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
          </svg>
        </span>
      </div>
      <h1 className="relative m-0 mt-6 text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] text-(--ink) leading-[1.05]">
        {u.name}
      </h1>
      <div className="relative mt-2 font-mono text-[11px] text-(--ink-4) tracking-[0.04em]">
        @{u.handle} · no Trapiche desde {u.joined}
      </div>
      <div className="relative mt-8 max-w-105 rounded-[18px] border border-dashed border-[rgba(var(--ink-rgb),0.22)] bg-(--cream-card) px-6 py-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4)">
          {members ? "Perfil para membros" : "Perfil privado"}
        </div>
        <p className="m-0 mt-2 text-[15px] leading-[1.55] text-(--ink-3)">
          {members
            ? `${u.name.split(" ")[0]} mostra a estante só para quem tem conta no Trapiche.`
            : `${u.name.split(" ")[0]} prefere manter as leituras só para si. As resenhas publicadas continuam nas páginas dos livros.`}
        </p>
        {members && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href={loginHref(`/u/${u.handle}`)}
              className="h-10 px-4 rounded-[10px] bg-(--ink-2) text-(--cream) text-[13px] font-semibold inline-flex items-center hover:bg-(--ink)"
            >
              Entrar
            </Link>
            <Link
              href={loginHref(`/u/${u.handle}`, "register")}
              className="h-10 px-4 rounded-[10px] border border-[rgba(var(--ink-rgb),0.2)] text-(--ink-2) text-[13px] font-semibold inline-flex items-center hover:bg-(--yellow-soft)"
            >
              Criar conta
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
