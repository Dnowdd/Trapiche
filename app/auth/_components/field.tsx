import type { ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FieldProps {
  label?: string;
  icon: ReactNode;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  toggle?: boolean;
  onToggle?: () => void;
  shown?: boolean;
  autoComplete?: string;
  foot?: ReactNode;
}

export default function Field({
  label,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  toggle,
  onToggle,
  shown,
  autoComplete,
  foot,
}: FieldProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase mb-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-(--ink-4) flex pointer-events-none">
          {icon}
        </span>
        <input
          type={toggle ? (shown ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`w-full h-12 rounded-[10px] border-[1.5px] border-[rgba(67,62,18,0.14)] bg-(--cream-card) pl-10.5 text-[14px] text-(--ink-2) outline-none focus:border-(--ink-3) focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,231,103,0.35)] placeholder:text-(--ink-4) transition-[border-color,box-shadow,background] duration-150 ${toggle ? "pr-11.5" : "pr-4"}`}
        />
        {toggle && (
          <span
            className="absolute right-3 text-(--ink-4) cursor-pointer flex p-1 rounded-[6px] transition-[color,background] duration-120 hover:text-(--ink-2) hover:bg-[rgba(67,62,18,0.06)]"
            onClick={onToggle}
            role="button"
            aria-label={shown ? "ocultar senha" : "mostrar senha"}
          >
            {shown ? <EyeOff size={16} /> : <Eye size={16} />}
          </span>
        )}
      </div>
      {foot}
    </div>
  );
}
