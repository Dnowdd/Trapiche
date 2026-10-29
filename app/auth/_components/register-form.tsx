import Link from "next/link";
import {
  MailIcon,
  LockIcon,
  UserIcon,
  AtIcon,
  Arrow,
  Check,
  Loader,
} from "./icons";
import Field from "./field";
import PasswordStrength from "./password-strength";
import type { AuthMode } from "./types";

interface RegisterFormProps {
  name: string;
  setName: (v: string) => void;
  handle: string;
  setHandle: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  pw: string;
  setPw: (v: string) => void;
  showPw: boolean;
  setShowPw: (v: boolean) => void;
  score: number;
  agree: boolean;
  setAgree: (v: boolean) => void;
  loading: boolean;
  go: (mode: AuthMode) => void;
  submit: (e: { preventDefault(): void }) => void;
}

export default function RegisterForm({
  name,
  setName,
  handle,
  setHandle,
  email,
  setEmail,
  pw,
  setPw,
  showPw,
  setShowPw,
  score,
  agree,
  setAgree,
  loading,
  submit,
}: RegisterFormProps) {
  return (
    <form
      className="animate-[modeIn_0.4s_cubic-bezier(0.2,0.7,0.2,1)]"
      onSubmit={submit}
    >
      <div className="mb-3.5">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.08em] uppercase flex items-center gap-2 mb-3.5">
          <span className="w-1.25 h-1.25 rounded-full bg-(--ink-3)"></span>É de
          graça, sempre
        </div>
        <h1 className="m-0 mb-2 text-[34px] font-extrabold tracking-tight leading-[1.05] text-(--ink) text-balance">
          Crie sua conta.
        </h1>
        <p className="m-0 text-[14px] text-(--ink-3) leading-[1.55]">
          Comece a catalogar suas leituras em menos de um minuto.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Field
          label="Nome"
          icon={<UserIcon />}
          placeholder="Como te chamam"
          value={name}
          onChange={setName}
          autoComplete="name"
        />
        <Field
          label="Usuário"
          icon={<AtIcon />}
          placeholder="seu_user"
          value={handle}
          onChange={setHandle}
          autoComplete="username"
        />
      </div>
      <Field
        label="E-mail"
        icon={<MailIcon />}
        type="email"
        placeholder="voce@email.com"
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />
      <Field
        label="Senha"
        icon={<LockIcon />}
        placeholder="Crie uma senha forte"
        value={pw}
        onChange={setPw}
        toggle
        shown={showPw}
        onToggle={() => setShowPw(!showPw)}
        autoComplete="new-password"
        foot={<PasswordStrength pw={pw} score={score} showReqs />}
      />

      <label className="flex items-start gap-2.5 mt-2.5 mb-2.5 text-[12px] text-(--ink-3) leading-normal cursor-pointer">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="peer hidden"
        />
        <span className="w-4.5 h-4.5 rounded-[5px] border-[1.5px] border-[rgba(67,62,18,0.3)] shrink-0 mt-px flex items-center justify-center transition-[background,border-color] duration-120 text-(--ink) peer-checked:bg-(--yellow) peer-checked:border-(--yellow-deep) [&_svg]:w-2.75 [&_svg]:h-2.75 [&_svg]:opacity-0 peer-checked:[&_svg]:opacity-100">
          <Check />
        </span>
        <span>
          Li e aceito os{" "}
          <Link
            href="/termos"
            target="_blank"
            className="text-(--ink-2) font-semibold border-b border-(--ink-4) hover:border-(--ink-2)"
          >
            Termos de uso
          </Link>{" "}
          e a{" "}
          <Link
            href="/privacidade"
            target="_blank"
            className="text-(--ink-2) font-semibold border-b border-(--ink-4) hover:border-(--ink-2)"
          >
            Política de Privacidade
          </Link>{" "}
          do Trapiche.
        </span>
      </label>

      <button
        className="w-full h-12.5 rounded-[10px] bg-(--ink-2) text-(--yellow) text-[15px] font-semibold tracking-[-0.005em] border border-(--ink-2) flex items-center justify-center gap-2.25 transition-[transform,box-shadow,opacity] duration-100 hover:enabled:-translate-y-px hover:enabled:shadow-[0_12px_24px_-14px_rgba(67,62,18,0.6)] disabled:opacity-60 disabled:cursor-not-allowed [&_svg]:w-3.75 [&_svg]:h-3.75"
        type="submit"
        disabled={loading}
      >
        {loading ? (
          <Loader className="animate-spin" />
        ) : (
          <>
            Criar minha conta <Arrow />
          </>
        )}
      </button>
    </form>
  );
}
