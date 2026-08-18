"use client";

import { useEffect, useState } from "react";
import { Clock, Sparkle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetDate?: string | Date | number;
  className?: string;
}

// Default target: August 19, 2026 at 14:40 IST (configurable via NEXT_PUBLIC_EVENT_DATE)
const DEFAULT_TARGET_TIMESTAMP =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_EVENT_DATE
    ? new Date(process.env.NEXT_PUBLIC_EVENT_DATE).getTime()
    : new Date("2026-08-19T14:40:00+05:30").getTime();

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

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const targetMs = targetDate
    ? new Date(targetDate).getTime()
    : DEFAULT_TARGET_TIMESTAMP;

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(targetMs),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetMs));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetMs]);

  const { days, hours, minutes, seconds, total } = timeLeft;
  const isLive = mounted && total <= 0;

  return (
    <div
      className={cn(
        "rounded-[16px] border border-[#202d24] bg-[#111813] p-4 shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between border-b border-[#202d24] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#22c55e]">
            <Clock size={14} weight="bold" />
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            {isLive ? "Hunt Kickoff" : "Event Kickoff Countdown"}
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
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-[10px] border border-[#202d24] bg-[#16201a] text-white">
          <span
            className="countdown font-mono text-2xl sm:text-4xl font-extrabold text-white tracking-tight"
            aria-live="polite"
            aria-label={`${days} days`}
          >
            <span style={{ "--value": days } as React.CSSProperties}>
              {mounted ? String(days).padStart(2, "0") : "--"}
            </span>
          </span>
          <span className="mt-1 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
            days
          </span>
        </div>

        {/* Hours */}
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-[10px] border border-[#202d24] bg-[#16201a] text-white">
          <span
            className="countdown font-mono text-2xl sm:text-4xl font-extrabold text-white tracking-tight"
            aria-live="polite"
            aria-label={`${hours} hours`}
          >
            <span style={{ "--value": hours } as React.CSSProperties}>
              {mounted ? String(hours).padStart(2, "0") : "--"}
            </span>
          </span>
          <span className="mt-1 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
            hours
          </span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-[10px] border border-[#202d24] bg-[#16201a] text-white">
          <span
            className="countdown font-mono text-2xl sm:text-4xl font-extrabold text-white tracking-tight"
            aria-live="polite"
            aria-label={`${minutes} min`}
          >
            <span style={{ "--value": minutes } as React.CSSProperties}>
              {mounted ? String(minutes).padStart(2, "0") : "--"}
            </span>
          </span>
          <span className="mt-1 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
            min
          </span>
        </div>

        {/* Seconds */}
        <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-[10px] border border-[#202d24] bg-[#16201a] text-white">
          <span
            className="countdown font-mono text-2xl sm:text-4xl font-extrabold text-[#22c55e] tracking-tight"
            aria-live="polite"
            aria-label={`${seconds} sec`}
          >
            <span style={{ "--value": seconds } as React.CSSProperties}>
              {mounted ? String(seconds).padStart(2, "0") : "--"}
            </span>
          </span>
          <span className="mt-1 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#22c55e]">
            sec
          </span>
        </div>
      </div>
    </div>
  );
}
