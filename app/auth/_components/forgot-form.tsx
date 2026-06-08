import { MailIcon, Arrow, ArrowBack, Loader } from "./icons";
import Field from "./field";
import type { AuthMode } from "./types";

interface ForgotFormProps {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  go: (mode: AuthMode) => void;
  submit: (e: { preventDefault(): void }) => void;
}

export default function ForgotForm({
  email,
  setEmail,
  loading,
  go,
  submit,
}: ForgotFormProps) {
  return (
    <form
      className="animate-[modeIn_0.4s_cubic-bezier(0.2,0.7,0.2,1)]"
      onSubmit={submit}
    >
      <span
        className="inline-flex items-center gap-1.75 text-[12px] text-(--ink-3) cursor-pointer mb-5.5 hover:text-(--ink-2) [&_svg]:w-3.25 [&_svg]:h-3.25"
        onClick={() => go("login")}
      >
        <ArrowBack /> Voltar
      </span>
      <div className="mb-7">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.08em] uppercase flex items-center gap-2 mb-3.5">
          <span className="w-1.25 h-1.25 rounded-full bg-(--ink-3)"></span>
          Recuperação
        </div>
        <h1 className="m-0 mb-2 text-[34px] font-extrabold tracking-tight leading-[1.05] text-(--ink) text-balance">
          Esqueceu a senha?
        </h1>
        <p className="m-0 text-[14px] text-(--ink-3) leading-[1.55]">
          Sem problema. Informe seu e-mail e enviamos um link para você criar
          uma nova.
        </p>
      </div>

      <Field
        label="E-mail da conta"
        icon={<MailIcon />}
        type="email"
        placeholder="voce@email.com"
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />

      <button
        className="w-full h-12.5 rounded-[10px] bg-(--ink-2) text-(--yellow) text-[15px] font-semibold tracking-[-0.005em] border border-(--ink-2) flex items-center justify-center gap-2.25 transition-[transform,box-shadow,opacity] duration-100 hover:enabled:-translate-y-px hover:enabled:shadow-[0_12px_24px_-14px_rgba(67,62,18,0.6)] disabled:opacity-60 disabled:cursor-not-allowed [&_svg]:w-3.75 [&_svg]:h-3.75 mt-2"
        type="submit"
        disabled={loading}
      >
        {loading ? (
          <Loader className="animate-spin" />
        ) : (
          <>
            Enviar link de recuperação <Arrow />
          </>
        )}
      </button>

      <div className="mt-5.5 text-center text-[12px] text-(--ink-4) leading-normal">
        Lembrou a senha?{" "}
        <a
          className="text-(--ink-3) border-b border-(--ink-4) cursor-pointer hover:text-(--ink-2)"
          onClick={() => go("login")}
        >
          Voltar ao login
        </a>
      </div>
    </form>
  );
}
