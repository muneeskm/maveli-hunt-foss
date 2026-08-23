"use client";

import { useEffect, useState } from "react";
import { Clock, Sparkle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

import { useGame } from "@/hooks/use-game";

interface CountdownTimerProps {
  targetDate?: string | Date | number;
  className?: string;
  onComplete?: () => void;
}

// Default target: August 19, 2026 at 14:40 IST (configurable via NEXT_PUBLIC_EVENT_DATE or settings.eventStartIso)
const DEFAULT_TARGET_ISO = "2026-08-23T12:40:00+05:30";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(targetMs: number): TimeLeft {
  const diff = Math.max(0, targetMs - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, total: diff };
}

export function CountdownTimer({ targetDate, className, onComplete }: CountdownTimerProps) {
  const { settings } = useGame();
  const effectiveTarget =
    targetDate ??
    settings.eventStartIso ??
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_EVENT_DATE
      ? process.env.NEXT_PUBLIC_EVENT_DATE
      : DEFAULT_TARGET_ISO);

  const targetMs = new Date(effectiveTarget).getTime() || new Date(DEFAULT_TARGET_ISO).getTime();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(targetMs),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(targetMs);
      setTimeLeft(remaining);
      if (remaining.total <= 0) {
        onComplete?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetMs, onComplete]);

  const { days, hours, minutes, seconds, total } = timeLeft;
  const isLive = mounted && total <= 0;

  return (
    <div
      className={cn(
        "liquid-glass p-4 text-white",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-white/10 border border-white/20 text-[#22c55e]">
            <Clock size={14} weight="bold" />
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            {isLive ? "Hunt Kickoff" : "Event countdown"}
          </span>
        </div>
        {isLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] anim-blink" /> LIVE NOW
          </span>
        )}
      </div>

      <div className="grid grid-flow-col gap-2 sm:gap-3 text-center justify-center auto-cols-fr">
        {/* Days */}
        <div className="liquid-glass-subtle flex flex-col items-center justify-center p-2.5 sm:p-3 text-white">
          <span
            className="countdown font-mono text-2xl sm:text-4xl font-extrabold text-white tracking-tight"
            aria-live="polite"
            aria-label={`${days} days`}
          >
            <span style={{ "--value": days } as React.CSSProperties}>
              {mounted ? String(days).padStart(2, "0") : "--"}
            </span>
          </span>
          <span className="mt-1 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#cbd5e1]">
            days
          </span>
        </div>

        {/* Hours */}
        <div className="liquid-glass-subtle flex flex-col items-center justify-center p-2.5 sm:p-3 text-white">
          <span
            className="countdown font-mono text-2xl sm:text-4xl font-extrabold text-white tracking-tight"
            aria-live="polite"
            aria-label={`${hours} hours`}
          >
            <span style={{ "--value": hours } as React.CSSProperties}>
              {mounted ? String(hours).padStart(2, "0") : "--"}
            </span>
          </span>
          <span className="mt-1 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#cbd5e1]">
            hours
          </span>
        </div>

        {/* Minutes */}
        <div className="liquid-glass-subtle flex flex-col items-center justify-center p-2.5 sm:p-3 text-white">
          <span
            className="countdown font-mono text-2xl sm:text-4xl font-extrabold text-white tracking-tight"
            aria-live="polite"
            aria-label={`${minutes} minutes`}
          >
            <span style={{ "--value": minutes } as React.CSSProperties}>
              {mounted ? String(minutes).padStart(2, "0") : "--"}
            </span>
          </span>
          <span className="mt-1 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#cbd5e1]">
            min
          </span>
        </div>

        {/* Seconds */}
        <div className="liquid-glass-subtle flex flex-col items-center justify-center p-2.5 sm:p-3 text-white">
          <span
            className="countdown font-mono text-2xl sm:text-4xl font-extrabold text-[#22c55e] tracking-tight drop-shadow-sm"
            aria-live="polite"
            aria-label={`${seconds} seconds`}
          >
            <span style={{ "--value": seconds } as React.CSSProperties}>
              {mounted ? String(seconds).padStart(2, "0") : "--"}
            </span>
          </span>
          <span className="mt-1 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#86efac]">
            sec
          </span>
        </div>
      </div>
    </div>
  );
}
