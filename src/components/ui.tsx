"use client";

import type { InputHTMLAttributes, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Phase } from "@/lib/types";

export function Panel({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className={cn("panel", className)} onClick={onClick}>
      {children}
    </div>
  );
}

export function Chip({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "leaf" | "alarm";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "chip",
        tone === "leaf" && "chip-leaf",
        tone === "alarm" && "border-red-400/40 text-red-300",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  size?: "md" | "sm";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "ghost" && "btn-ghost",
        variant === "danger" && "btn-danger",
        size === "sm" && "btn-sm",
        disabled && "opacity-40 pointer-events-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-fog">
          {label}
        </span>
      )}
      <input className="field" {...props} />
      {hint && <span className="mt-1.5 block text-xs text-moss">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label,
  hint,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-fog">
          {label}
        </span>
      )}
      <select className="field appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239aa79c%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_14px_center] bg-no-repeat pr-9" {...props}>
        {children}
      </select>
      {hint && <span className="mt-1.5 block text-xs text-moss">{hint}</span>}
    </label>
  );
}

const PHASE_LABEL: Record<Phase, string> = {
  setup: "STAND BY",
  day1: "DAY 1 - TRACKING",
  night: "NIGHT - SIGNAL LOST",
  day2: "DAY 2 - RESCUE",
  rescued: "MAVELLI FOUND",
  ended: "EVENT OVER",
};

export function PhasePill({ phase }: { phase: Phase }) {
  const alarm = phase === "day2" || phase === "rescued";
  const ended = phase === "ended";
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          alarm ? "bg-leaf anim-blink" : ended ? "bg-fog" : "bg-leaf-dim",
        )}
      />
      <span
        className={cn(
          "font-mono text-[11px] uppercase tracking-[0.18em]",
          alarm ? "text-leaf" : ended ? "text-fog" : "text-leaf-dim",
        )}
      >
        {PHASE_LABEL[phase]}
      </span>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-px w-4 bg-leaf-dim" />
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-fog">
        {children}
      </span>
    </div>
  );
}

export function WordBlock({
  word,
  blurred,
}: {
  word: string;
  blurred?: boolean;
}) {
  return (
    <span
      className={cn(
        "font-mono text-lg font-bold tracking-[0.22em] text-leaf",
        blurred && "select-none",
      )}
      style={blurred ? { filter: "blur(8px)" } : undefined}
    >
      {word}
    </span>
  );
}
