"use client";

import type { InputHTMLAttributes, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Phase } from "@/lib/types";

export function Panel({
  children,
  className,
  tone = "default",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "mint" | "teal" | "blush" | "yellow" | "paper";
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className={cn(
        "panel p-5 transition-all",
        tone === "mint" && "panel-mint",
        tone === "teal" && "panel-teal",
        tone === "blush" && "panel-blush",
        tone === "yellow" && "panel-yellow",
        tone === "paper" && "bg-[#fcfaf5] border border-[#b6b6b6]",
        className,
      )}
      onClick={onClick}
    >
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
  tone?: "default" | "leaf" | "yellow" | "mint" | "teal" | "alarm";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "chip",
        (tone === "leaf" || tone === "yellow") && "chip-yellow",
        tone === "mint" && "chip-mint",
        tone === "teal" && "chip-teal",
        tone === "alarm" && "bg-red-50 border-red-200 text-red-800",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TaglineBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("tagline-badge", className)}>
      {children}
    </div>
  );
}

export function HighlightWord({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("highlight-wash", className)}>
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
  variant?: "primary" | "ghost" | "outline" | "mint" | "teal" | "blush" | "danger";
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
        (variant === "ghost" || variant === "outline") && "btn-ghost",
        variant === "mint" && "btn-mint",
        variant === "teal" && "btn-teal",
        variant === "blush" && "btn-blush",
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
        <span className="mb-1.5 block font-sans text-xs font-semibold text-[#1a3300]">
          {label}
        </span>
      )}
      <input className="field" {...props} />
      {hint && <span className="mt-1.5 block font-sans text-xs text-[#666666]">{hint}</span>}
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
        <span className="mb-1.5 block font-sans text-xs font-semibold text-[#1a3300]">
          {label}
        </span>
      )}
      <select
        className="field appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%231a3300%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_14px_center] bg-no-repeat pr-9"
        {...props}
      >
        {children}
      </select>
      {hint && <span className="mt-1.5 block font-sans text-xs text-[#666666]">{hint}</span>}
    </label>
  );
}

const PHASE_LABEL: Record<Phase, string> = {
  setup: "STANDBY",
  day1: "DAY 1 — TRACKING",
  night: "NIGHT — SIGNAL LOST",
  day2: "DAY 2 — RESCUE",
  rescued: "MAVELLI FOUND",
  ended: "EVENT OVER",
};

export function PhasePill({ phase }: { phase: Phase }) {
  const isAlarm = phase === "day2" || phase === "rescued";
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#b6b6b6] bg-white px-3 py-1 text-xs">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isAlarm ? "bg-red-500 anim-blink" : "bg-[#1a3300]",
        )}
      />
      <span className="font-mono text-[10px] font-medium tracking-wider text-[#1a3300]">
        {PHASE_LABEL[phase]}
      </span>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-[#1a3300]" />
      <span className="font-sans text-xs font-bold uppercase tracking-wider text-[#1a3300]">
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
        "font-mono text-lg font-bold tracking-widest text-[#1a3300] bg-[#ffe95c] rounded-[4px] px-2.5 py-0.5",
        blurred && "select-none",
      )}
      style={blurred ? { filter: "blur(8px)" } : undefined}
    >
      {word}
    </span>
  );
}
