import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export const control =
  "w-full rounded-[10px] border-[1.5px] border-[rgba(67,62,18,0.14)] bg-(--cream-card) px-3.5 text-[14px] text-(--ink-2) outline-none focus:border-(--ink-3) focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,231,103,0.35)] placeholder:text-(--ink-4) transition-[border-color,box-shadow,background] duration-150 disabled:opacity-60";

export function FormField({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block mb-4", className)}>
      <span className="block font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase mb-1">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block mt-1.5 text-[11px] text-(--ink-4) leading-normal">
          {hint}
        </span>
      )}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        control,
        "py-3 min-h-24 resize-y leading-[1.55]",
        className,
      )}
      {...props}
    />
  );
}

const variants = {
  primary:
    "bg-(--ink-2) text-(--yellow) border-(--ink-2) hover:enabled:-translate-y-px hover:enabled:shadow-[0_12px_24px_-14px_rgba(67,62,18,0.6)]",
  yellow:
    "bg-(--yellow) text-(--ink) border-(--yellow-deep) hover:enabled:-translate-y-px",
  ghost:
    "bg-transparent text-(--ink-2) border-[rgba(67,62,18,0.2)] hover:enabled:bg-(--yellow-soft)",
  danger:
    "bg-transparent text-[#9a4a2a] border-[rgba(154,74,42,0.35)] hover:enabled:bg-[rgba(154,74,42,0.06)]",
} as const;

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "h-10.5 px-4.5 rounded-[10px] border text-[13px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-[transform,box-shadow,background,opacity] duration-100 disabled:opacity-60 disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="M21 12a9 9 0 1 1-6.2-8.6" />
        </svg>
      ) : (
        children
      )}
    </button>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 px-3.5 py-2.5 rounded-[10px] bg-red-50 border border-red-200 text-[13px] text-red-700"
    >
      {message}
    </div>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex justify-end gap-2.5">{children}</div>;
}
