"use client";

interface Option {
  id: string;
  label: string;
  count?: number;
}

interface ChipsProps {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}

const Chips = ({ options, value, onChange, label }: ChipsProps) => {
  return (
    <div className="flex items-center gap-2 mb-[22px] flex-wrap">
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-(--ink-4) mr-2">
          {label}
        </span>
      )}
      {options.map((o) => (
        <button
          key={o.id}
          className="group text-[12px] font-medium py-[7px] px-[14px] rounded-full border border-[rgba(67,62,18,0.15)] bg-transparent text-(--ink-3) inline-flex items-center gap-1.5 cursor-pointer transition-[background,color,border-color] duration-[120ms] hover:bg-(--yellow-soft) hover:text-(--ink-2) aria-pressed:bg-(--ink-2) aria-pressed:text-(--yellow) aria-pressed:border-(--ink-2)"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.label}
          {o.count != null && (
            <span className="font-mono text-[10px] text-(--ink-5) group-aria-pressed:text-(--yellow-soft)">
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default Chips;
