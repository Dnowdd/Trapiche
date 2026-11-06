import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Preferências de e-mail",
  robots: { index: false, follow: false },
};

const LABEL: Record<string, string> = {
  digest: "o resumo do mês",
  reminder: "os lembretes de leitura",
};

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo = "" } = await searchParams;
  const label = LABEL[tipo];
  const session = await getSession();
  const settings = session
    ? `/u/${session.user.handle as string}?editar=emails`
    : "/auth";

  return (
    <div
      data-responsive
      className="bg-(--cream) rounded-[22px] md:rounded-[30px] border-8 md:border-15 border-(--yellow) mx-2 md:mx-3.75 overflow-hidden"
    >
      <div className="max-w-140 mx-auto px-6 py-20 md:py-28 text-center">
        <div className="mx-auto size-14 rounded-full bg-(--ink-2) text-(--yellow) flex items-center justify-center text-[24px]">
          {label ? "✓" : "!"}
        </div>
        <h1 className="m-0 mt-6 text-[28px] md:text-[34px] font-extrabold tracking-[-0.025em] text-(--ink) leading-tight">
          {label ? "Pronto, não mandamos mais." : "Esse link não funcionou."}
        </h1>
        <p className="m-0 mt-3 text-[15px] leading-[1.6] text-(--ink-3)">
          {label
            ? `Você não vai mais receber ${label}. E-mails de conta e segurança continuam chegando normalmente.`
            : "O link de descadastro está incompleto ou expirou. Você pode mudar suas preferências direto no seu perfil."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={settings}
            className="h-11 px-5 rounded-[12px] bg-(--ink-2) text-(--yellow) text-[14px] font-semibold inline-flex items-center hover:bg-(--ink)"
          >
            {session ? "Ver minhas preferências" : "Entrar"}
          </Link>
          <Link
            href="/"
            className="h-11 px-5 rounded-[12px] border border-[rgba(67,62,18,0.2)] text-(--ink-2) text-[14px] font-semibold inline-flex items-center hover:bg-(--yellow-soft)"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
