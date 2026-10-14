import { Check } from "./icons";

export function scorePassword(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length === 0) score = 0;
  return score;
}

const STRENGTH_LABELS = ["—", "fraca", "razoável", "boa", "forte"];

const REQS = [
  { test: (pw: string) => pw.length >= 8, label: "8+ caracteres" },
  {
    test: (pw: string) => /[A-Z]/.test(pw) && /[a-z]/.test(pw),
    label: "Maiúscula e minúscula",
  },
  { test: (pw: string) => /\d/.test(pw), label: "Um número" },
  { test: (pw: string) => /[^A-Za-z0-9]/.test(pw), label: "Um símbolo" },
];

const ON_COLORS: Record<number, string> = {
  1: "bg-[#c0894b]",
  2: "bg-[#d7b937]",
  3: "bg-[#9ca93c]",
  4: "bg-[#5e8a2e]",
};

interface PasswordStrengthProps {
  pw: string;
  score: number;
  showReqs?: boolean;
}

export default function PasswordStrength({
  pw,
  score,
  showReqs = false,
}: PasswordStrengthProps) {
  if (pw.length === 0) return null;

  return (
    <div className="mt-2.5">
      <div className="flex gap-1.25">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`flex-1 h-1 rounded-[2px] transition-[background] duration-[250ms] ${i <= score ? ON_COLORS[score] : "bg-[rgba(67,62,18,0.1)]"}`}
          ></span>
        ))}
      </div>
      <div className="mt-1.5 font-mono text-[10px] tracking-[0.04em] text-(--ink-4) flex justify-between">
        <span>força da senha</span>
        <strong className="text-(--ink-2) font-semibold">
          {STRENGTH_LABELS[score]}
        </strong>
      </div>
      {showReqs && (
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-1.5 mt-2.5">
          {REQS.map((r, i) => {
            const met = r.test(pw);
            return (
              <div
                key={i}
                className={`flex items-center gap-1.75 text-[11px] transition-[color] duration-[200ms] ${met ? "text-(--ink-2)" : "text-(--ink-4)"}`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-[background,border-color] duration-[200ms] [&_svg]:w-2 [&_svg]:h-2 [&_svg]:text-(--ink) ${met ? "bg-(--yellow) border-(--yellow-deep) [&_svg]:opacity-100" : "border-[rgba(67,62,18,0.22)] [&_svg]:opacity-0"}`}
                >
                  <Check />
                </span>
                {r.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
