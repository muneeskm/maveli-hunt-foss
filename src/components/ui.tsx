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
    <span className={cn("highlight-wash oleo-script-bold", className)}>
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
      <div className="relative">
        <select
          className="field cursor-pointer appearance-none bg-white pr-10 font-sans text-sm font-semibold text-[#1a3300] hover:border-[#1a3300] transition-colors"
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#f1f1f1] text-[#1a3300]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
            </svg>
          </span>
        </div>
      </div>
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
