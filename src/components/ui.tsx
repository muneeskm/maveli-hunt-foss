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
        tone === "paper" && "bg-[#111813] border border-[#202d24]",
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
        tone === "alarm" && "bg-[#3f1515] border border-red-800 text-red-300",
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
        <span className="mb-1.5 block font-sans text-xs font-semibold text-white">
          {label}
        </span>
      )}
      <input className="field" {...props} />
      {hint && <span className="mt-1.5 block font-sans text-xs text-[#9ca3af]">{hint}</span>}
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
        <span className="mb-1.5 block font-sans text-xs font-semibold text-white">
          {label}
        </span>
      )}
      <div className="relative">
        <select
          className="field cursor-pointer appearance-none bg-[#111813] pr-10 font-sans text-sm font-semibold text-white hover:border-[#22c55e] transition-colors"
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#16221a] text-[#22c55e]">
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
      {hint && <span className="mt-1.5 block font-sans text-xs text-[#9ca3af]">{hint}</span>}
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
    <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#202d24] bg-[#111813] px-3 py-1 text-xs">
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          isAlarm ? "bg-red-500 anim-blink" : "bg-[#22c55e] shadow-[0_0_6px_#22c55e]",
        )}
      />
      <span className="font-mono text-[10px] font-bold tracking-wider text-white">
        {PHASE_LABEL[phase]}
      </span>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
      <span className="font-sans text-xs font-bold uppercase tracking-wider text-white">
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
        "font-mono text-lg font-bold tracking-widest text-[#4ade80] bg-[#14261a] border border-[#22c55e]/40 rounded-[4px] px-2.5 py-0.5",
        blurred && "select-none",
      )}
      style={blurred ? { filter: "blur(8px)" } : undefined}
    >
      {word}
    </span>
  );
}
