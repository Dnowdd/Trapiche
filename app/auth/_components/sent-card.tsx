import { Arrow } from "./icons";
import type { AuthMode, SentContext } from "./types";

interface SentCardProps {
  email: string;
  context: SentContext;
  go: (mode: AuthMode) => void;
}

export default function SentCard({ email, context, go }: SentCardProps) {
  return (
    <div className="text-center animate-[modeIn_0.4s_cubic-bezier(0.2,0.7,0.2,1)]">
      <div className="w-16 h-16 rounded-full bg-(--yellow) border border-(--yellow-deep) flex items-center justify-center mx-auto mb-5.5 text-(--ink) [&_svg]:w-7 [&_svg]:h-7">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </div>
      <div className="mb-2">
        <h1 className="m-0 mb-2 text-[34px] font-extrabold tracking-tight leading-[1.05] text-(--ink) text-balance">
          {context === "reset" ? "Senha redefinida!" : "Verifique seu e-mail."}
        </h1>
      </div>
      {context === "reset" ? (
        <p className="text-[14px] text-(--ink-3) leading-[1.55] m-0 mb-2">
          Tudo certo — sua senha foi atualizada. Já pode entrar com ela.
        </p>
      ) : (
        <>
          <p className="text-[14px] text-(--ink-3) leading-[1.55] m-0 mb-1">
            Enviamos um link de recuperação para
          </p>
          <div className="inline-block font-mono text-[12px] text-(--ink-2) bg-(--cream-deep) rounded-[6px] py-1.5 px-3 my-1 tracking-[0.02em]">
            {email || "voce@email.com"}
          </div>
          <p className="text-[12px] text-(--ink-4) leading-normal m-0 mt-2">
            O link expira em 30 minutos. Não esqueça de olhar a caixa de spam.
          </p>
        </>
      )}

      <button
        className="w-full h-12.5 rounded-[10px] bg-(--ink-2) text-(--yellow) text-[15px] font-semibold tracking-[-0.005em] border border-(--ink-2) cursor-pointer flex items-center justify-center gap-2.25 transition-[transform,box-shadow] duration-100 hover:-translate-y-px hover:shadow-[0_12px_24px_-14px_rgba(67,62,18,0.6)] [&_svg]:w-3.75 [&_svg]:h-3.75 mt-6"
        onClick={() => go("login")}
      >
        {context === "reset" ? "Ir para o login" : "Voltar ao login"} <Arrow />
      </button>

      {context === "forgot" && (
        <div className="mt-5 text-[12px] text-(--ink-4)">
          Não chegou?{" "}
          <a
            className="text-(--ink-2) font-semibold cursor-pointer border-b border-(--ink-4)"
            onClick={() => go("forgot")}
          >
            Reenviar link
          </a>
        </div>
      )}
    </div>
  );
}
