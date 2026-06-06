import { MailIcon, LockIcon, GoogleMark, Arrow, Check } from "./icons";
import Field from "./field";
import type { AuthMode } from "./types";

interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  pw: string;
  setPw: (v: string) => void;
  showPw: boolean;
  setShowPw: (v: boolean) => void;
  go: (mode: AuthMode) => void;
  submit: (e: { preventDefault(): void }) => void;
}

export default function LoginForm({
  email,
  setEmail,
  pw,
  setPw,
  showPw,
  setShowPw,
  go,
  submit,
}: LoginFormProps) {
  return (
    <form
      className="animate-[modeIn_0.4s_cubic-bezier(0.2,0.7,0.2,1)]"
      onSubmit={submit}
    >
      <div className="mb-7">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.08em] uppercase flex items-center gap-2 mb-3.5">
          <span className="w-1.25 h-1.25 rounded-full bg-(--ink-3)"></span>
          Bem-vindo de volta
        </div>
        <h1 className="m-0 mb-2 text-[34px] font-extrabold tracking-tight leading-[1.05] text-(--ink) text-balance">
          Atraque no porto.
        </h1>
        <p className="m-0 text-[14px] text-(--ink-3) leading-[1.55]">
          Suas estantes, seu diário e suas listas estão esperando.
        </p>
      </div>

      <button
        type="button"
        className="w-full h-11.5 rounded-[10px] border border-[rgba(67,62,18,0.16)] bg-(--cream-card) text-(--ink-2) text-[14px] font-semibold flex items-center justify-center gap-2.5 cursor-pointer transition-[background,transform] duration-150 hover:bg-(--yellow-soft) hover:-translate-y-px [&_svg]:w-4.5 [&_svg]:h-4.5"
      >
        <GoogleMark /> Continuar com Google
      </button>
      <div className="flex items-center gap-3.5 my-5.5 font-mono text-[10px] text-(--ink-4) tracking-[0.08em] uppercase">
        <span className="flex-1 h-px bg-(--rule)"></span>ou com e-mail
        <span className="flex-1 h-px bg-(--rule)"></span>
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
        placeholder="Sua senha"
        value={pw}
        onChange={setPw}
        toggle
        shown={showPw}
        onToggle={() => setShowPw(!showPw)}
        autoComplete="current-password"
        foot={
          <div className="flex justify-between items-center mt-1.75">
            <span className="text-[11px] text-(--ink-4)">&nbsp;</span>
            <span
              className="text-[12px] text-(--ink-3) cursor-pointer border-b border-transparent hover:text-(--ink-2) hover:border-(--ink-4)"
              onClick={() => go("forgot")}
            >
              Esqueci minha senha
            </span>
          </div>
        }
      />

      <label className="flex items-start gap-2.5 mt-1 mb-5 text-[12px] text-(--ink-3) leading-normal cursor-pointer">
        <input type="checkbox" defaultChecked className="peer hidden" />
        <span className="w-4.5 h-4.5 rounded-[5px] border-[1.5px] border-[rgba(67,62,18,0.3)] shrink-0 mt-px flex items-center justify-center transition-[background,border-color] duration-120 text-(--ink) peer-checked:bg-(--yellow) peer-checked:border-(--yellow-deep) [&_svg]:w-2.75 [&_svg]:h-2.75 [&_svg]:opacity-0 peer-checked:[&_svg]:opacity-100">
          <Check />
        </span>
        Manter conectado neste dispositivo
      </label>

      <button
        className="w-full h-12.5 rounded-[10px] bg-(--ink-2) text-(--yellow) text-[15px] font-semibold tracking-[-0.005em] border border-(--ink-2) cursor-pointer flex items-center justify-center gap-2.25 transition-[transform,box-shadow] duration-100 hover:-translate-y-px hover:shadow-[0_12px_24px_-14px_rgba(67,62,18,0.6)] [&_svg]:w-3.75 [&_svg]:h-3.75"
        type="submit"
      >
        Entrar <Arrow />
      </button>

      <div className="mt-5.5 text-center text-[12px] text-(--ink-4) leading-normal">
        Ao entrar você concorda com os{" "}
        <a className="text-(--ink-3) border-b border-(--ink-4) cursor-pointer hover:text-(--ink-2)">
          Termos
        </a>{" "}
        e a{" "}
        <a className="text-(--ink-3) border-b border-(--ink-4) cursor-pointer hover:text-(--ink-2)">
          Política de Privacidade
        </a>
        .
      </div>
    </form>
  );
}
