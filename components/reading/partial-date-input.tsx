"use client";

import { useId, useState } from "react";
import { TextInput } from "@/components/shared/form";
import { cn } from "@/lib/utils";

const MIN_YEAR = 1500;
const MAX_YEAR = 2100;

type Kind = "Y" | "MY" | "DMY";

const MASKS: Record<Kind, string> = {
  Y: "aaaa",
  MY: "mm/aaaa",
  DMY: "dd/mm/aaaa",
};

function yearPrefixOk(p: string) {
  if (!p) return true;
  const lo = Number(p.padEnd(4, "0"));
  const hi = Number(p.padEnd(4, "9"));
  return hi >= MIN_YEAR && lo <= MAX_YEAR;
}

function monthPrefixOk(p: string) {
  if (p.length < 2) return p === "" || p === "0" || p === "1";
  const m = Number(p);
  return m >= 1 && m <= 12;
}

function kindOf(digits: string): Kind {
  const n = digits.length;
  if (n >= 3 && n <= 4 && yearPrefixOk(digits)) return "Y";
  if (
    n >= 5 &&
    n <= 6 &&
    monthPrefixOk(digits.slice(0, 2)) &&
    yearPrefixOk(digits.slice(2))
  )
    return "MY";
  return "DMY";
}

function format(digits: string, kind: Kind) {
  if (kind === "Y") return digits;
  if (kind === "MY")
    return digits.length > 2
      ? `${digits.slice(0, 2)}/${digits.slice(2)}`
      : digits;
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join("/");
}

function validDay(y: number, m: number, d: number) {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function valueFromDigits(digits: string): string | null {
  if (!digits) return "";
  const kind = kindOf(digits);
  if (kind === "Y" && digits.length === 4) return digits;
  if (kind === "MY" && digits.length === 6)
    return `${digits.slice(2)}-${digits.slice(0, 2)}`;
  if (kind === "DMY" && digits.length === 8) {
    const d = +digits.slice(0, 2);
    const m = +digits.slice(2, 4);
    const y = +digits.slice(4);
    if (y < MIN_YEAR || y > MAX_YEAR || !validDay(y, m, d)) return null;
    return `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
  }
  return null;
}

export function digitsFromValue(value: string) {
  const [y, m, d] = value.split("-");
  return `${d ?? ""}${m ?? ""}${y ?? ""}`;
}

export function maskDigits(digits: string) {
  return format(digits, kindOf(digits));
}

export default function PartialDateInput({
  label,
  value,
  onChange,
  today,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  today: string;
}) {
  const id = useId();
  const [digits, setDigits] = useState(value ? digitsFromValue(value) : "");
  const [blurred, setBlurred] = useState(false);

  const kind = kindOf(digits);
  const text = format(digits, kind);
  const ghost = digits ? MASKS[kind].slice(text.length) : "";

  const future = value ? value > today.slice(0, value.length) : false;
  const complete =
    (kind === "DMY" && digits.length === 8) ||
    (kind === "MY" && digits.length === 6);
  const invalid = value === null && (blurred || complete);

  const set = (next: string) => {
    setDigits(next);
    onChange(valueFromDigits(next));
  };

  const hint = invalid
    ? "Data incompleta ou inválida. Ex.: 2021, 03/2021 ou 12/03/2021."
    : future
      ? "Essa data está no futuro."
      : "";

  return (
    <div className="mb-4 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor={id}
          className="font-mono text-[10px] text-(--ink-3) tracking-[0.06em] uppercase"
        >
          {label}
        </label>
        <button
          type="button"
          className="text-[11px] text-(--ink-3) hover:text-(--ink) cursor-pointer"
          onClick={() => set(digitsFromValue(today))}
        >
          Hoje
        </button>
      </div>
      <div className="relative">
        <TextInput
          id={id}
          placeholder="dd/mm/aaaa"
          inputMode="numeric"
          autoComplete="off"
          value={text}
          aria-invalid={invalid || future}
          aria-describedby={`${id}-hint`}
          className={cn(
            "tabular-nums",
            (invalid || future) &&
              "border-[rgba(154,74,42,0.5)] focus:border-[rgba(154,74,42,0.7)]",
          )}
          onChange={(e) => {
            setBlurred(false);
            set(e.target.value.replace(/\D/g, "").slice(0, 8));
          }}
          onBlur={() => setBlurred(true)}
        />
        {ghost && (
          <span
            aria-hidden
            className="absolute inset-y-0 left-[calc(0.875rem+1.5px)] flex items-center text-[14px] tabular-nums pointer-events-none whitespace-pre"
          >
            <span className="invisible">{text}</span>
            <span className="text-(--ink-5)">{ghost}</span>
          </span>
        )}
      </div>
      <div
        id={`${id}-hint`}
        className={cn(
          "mt-1.5 text-[11px] leading-normal",
          invalid || future ? "text-[#9a4a2a]" : "text-(--ink-4)",
        )}
      >
        {hint}
      </div>
    </div>
  );
}
