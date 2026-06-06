import { LockIcon, Arrow } from "./icons";
import Field from "./field";
import PasswordStrength from "./password-strength";
import type { AuthMode } from "./types";

interface ResetFormProps {
  pw: string;
  setPw: (v: string) => void;
  pw2: string;
  setPw2: (v: string) => void;
  showPw: boolean;
  setShowPw: (v: boolean) => void;
  showPw2: boolean;
  setShowPw2: (v: boolean) => void;
  score: number;
  go: (mode: AuthMode) => void;
  submit: (e: { preventDefault(): void }) => void;
}

export default function ResetForm({
  pw,
  setPw,
  pw2,
  setPw2,
  showPw,
  setShowPw,
  showPw2,
  setShowPw2,
  score,
  submit,
}: ResetFormProps) {
  const match = pw.length > 0 && pw === pw2;
  const mismatch = pw2.length > 0 && pw !== pw2;

  return (
    <form className="animate-[modeIn_0.4s_cubic-bezier(0.2,0.7,0.2,1)]" onSubmit={submit}>
      <div className="mb-7">
        <div className="font-mono text-[11px] text-(--ink-4) tracking-[0.08em] uppercase flex items-center gap-2 mb-3.5">
          <span className="w-1.25 h-1.25 rounded-full bg-(--ink-3)"></span>
          Quase lá
        </div>
        <h1 className="m-0 mb-2 text-[34px] font-extrabold tracking-tight leading-[1.05] text-(--ink) text-balance">
          Defina uma nova senha.
        </h1>
        <p className="m-0 text-[14px] text-(--ink-3) leading-[1.55]">
          Escolha uma senha forte que você ainda não tenha usado aqui.
        </p>
      </div>

      <Field
        label="Nova senha"
        icon={<LockIcon />}
        placeholder="Nova senha"
        value={pw}
        onChange={setPw}
        toggle
        shown={showPw}
        onToggle={() => setShowPw(!showPw)}
        autoComplete="new-password"
        foot={<PasswordStrength pw={pw} score={score} />}
      />
      <Field
        label="Confirmar senha"
        icon={<LockIcon />}
        placeholder="Repita a senha"
        value={pw2}
        onChange={setPw2}
        toggle
        shown={showPw2}
        onToggle={() => setShowPw2(!showPw2)}
        autoComplete="new-password"
        foot={
          <div className="flex justify-between items-center mt-1.75">
            <span
              className="text-[11px]"
              style={{
                color: mismatch ? "#9a4a2a" : match ? "#5E8A2E" : "var(--ink-4)",
              }}
            >
              {mismatch
                ? "As senhas não conferem"
                : match
                  ? "✓ As senhas conferem"
                  : " "}
            </span>
          </div>
        }
      />

      <button
        className="w-full h-12.5 rounded-[10px] bg-(--ink-2) text-(--yellow) text-[15px] font-semibold tracking-[-0.005em] border border-(--ink-2) cursor-pointer flex items-center justify-center gap-2.25 transition-[transform,box-shadow] duration-100 hover:-translate-y-px hover:shadow-[0_12px_24px_-14px_rgba(67,62,18,0.6)] [&_svg]:w-3.75 [&_svg]:h-3.75 mt-2"
        type="submit"
      >
        Redefinir senha <Arrow />
      </button>
    </form>
  );
}
