"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Sparkle,
  HandPointing,
  Radio,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/*
 * ============================================================================
 * MAVELI SIGNAL — INTERACTIVE INTRO EXPERIENCE (REIMAGINED)
 * ============================================================================
 * Visual Language: Creative Studio Sketchbook on Cream Paper (DESIGN.md)
 *
 * Maveli is the PROTAGONIST.
 * The player intercepts a mysterious frequency and tunes into Maveli directly.
 * The hand-drawn signal lines and tuning arc sit BEHIND and AROUND Maveli.
 * As the player swipes/drags around the central area, Maveli emerges from
 * faint pencil contours into a vibrant full-body character who speaks directly
 * to the player.
 * ============================================================================
 */

export type IntroState =
  | "searching"
  | "tuning"
  | "acquired"
  | "conversation"
  | "ready"
  | "complete";

export const introMessages = {
  headerLabel: "SIGNAL TRANSMISSION / UNKNOWN",
  searching: "SEARCHING FOR MAVELI...",
  initialTransmitting: "Something is transmitting...",
  prompt: "Swipe around to tune the signal →",
  idleReminder: "Drag around Maveli to lock frequency →",
  at35: "...hello?",
  at55: "Can you hear me?",
  at72: "WAIT.",
  at88: "I SEE YOU.",
  at95: "A little more...",
  finalSequence: [
    "Oh. Finally.",
    "I need your help.",
    "I've been spotted around your campus.",
    "Think you can find me first?",
    "Let's begin.",
  ],
  cta: "ENTER MAVELI TRACKER",
  skip: "SKIP INTRO →",
};

const STORAGE_KEY = "maveli-intro-completed";
const SESSION_KEY = "mh:intro-seen";

interface TrackerIntroProps {
  onDone: () => void;
}

export function TrackerIntro({ onDone }: TrackerIntroProps) {
  const [signal, setSignal] = useState<number>(12);
  const [state, setState] = useState<IntroState>("searching");
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [interactiveReady, setInteractiveReady] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [showIdleHint, setShowIdleHint] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dialogueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const acquiredTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Complete and dismiss intro cleanly
  const completeIntro = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, "true");
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // Storage disabled fallback
      }
    }
    setState("complete");
    const dismissTimer = setTimeout(() => {
      onDoneRef.current();
    }, 240);
    return () => clearTimeout(dismissTimer);
  }, []);

  // Developer console reset helper: window.resetMaveliIntro()
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as unknown as { resetMaveliIntro?: () => void }).resetMaveliIntro = () => {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        window.location.reload();
      };
    }
  }, []);

  // Keyboard accessibility: Escape to skip, Left/Right arrow keys to tune
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        completeIntro();
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        if (state !== "acquired" && state !== "conversation" && state !== "ready" && state !== "complete") {
          setHasInteracted(true);
          setSignal((prev) => Math.min(100, Math.round((prev + 6) * 10) / 10));
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        if (state !== "acquired" && state !== "conversation" && state !== "ready" && state !== "complete") {
          setHasInteracted(true);
          setSignal((prev) => Math.max(12, Math.round((prev - 6) * 10) / 10));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [completeIntro, state]);

  // Phase 1: Non-interactive transmission inception (~1.2s delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setInteractiveReady(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Idle discovery hint timer (~3s if user hasn't interacted)
  useEffect(() => {
    if (!hasInteracted && interactiveReady) {
      idleTimerRef.current = setTimeout(() => {
        setShowIdleHint(true);
      }, 3000);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [hasInteracted, interactiveReady]);

  // Handle 100% Signal Acquisition transition
  useEffect(() => {
    if (signal >= 100 && state !== "acquired" && state !== "conversation" && state !== "ready" && state !== "complete") {
      setState("acquired");
      // Gentle haptic feedback if supported on mobile
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([30, 40, 60]);
        } catch {}
      }

      // Transition smoothly to Maveli conversational sequence
      acquiredTimerRef.current = setTimeout(() => {
        setState("conversation");
        setMessageIndex(0);
      }, 950);
    }

    return () => {
      if (acquiredTimerRef.current) clearTimeout(acquiredTimerRef.current);
    };
  }, [signal, state]);

  // Automatic progression through dialogue lines at 100% (~850ms per line)
  useEffect(() => {
    if (state !== "conversation") return;

    if (messageIndex < introMessages.finalSequence.length - 1) {
      dialogueTimerRef.current = setTimeout(() => {
        setMessageIndex((prev) => prev + 1);
      }, 900);
    } else {
      // Final line reached ("Let's begin.") -> reveal Primary CTA
      dialogueTimerRef.current = setTimeout(() => {
        setState("ready");
      }, 850);
    }

    return () => {
      if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    };
  }, [state, messageIndex]);

  // Forgiving circular / angular drag input handler across the entire central area
  const startDrag = (clientX: number, clientY: number, pointerId?: number) => {
    if (!interactiveReady || signal >= 100 || state === "acquired" || state === "conversation" || state === "ready") return;
    setIsDragging(true);
    setHasInteracted(true);
    setShowIdleHint(false);
    if (state === "searching") setState("tuning");
    if (pointerId !== undefined) activePointerIdRef.current = pointerId;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(clientY - centerY, clientX - centerX);
      lastAngleRef.current = angle;
      lastPosRef.current = { x: clientX, y: clientY };
    }
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!isDragging || signal >= 100 || state === "acquired" || state === "conversation" || state === "ready") return;

    let deltaProgress = 0;

    if (containerRef.current && lastAngleRef.current !== null) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const currentAngle = Math.atan2(clientY - centerY, clientX - centerX);

      let angleDiff = currentAngle - lastAngleRef.current;
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      // Angular progression delta (forgiving rotary tuning)
      const angularDelta = Math.abs(angleDiff) * (180 / Math.PI) * 0.38;

      // Linear travel delta (forgiving linear swipe / brush)
      let linearDelta = 0;
      if (lastPosRef.current) {
        const dx = clientX - lastPosRef.current.x;
        const dy = clientY - lastPosRef.current.y;
        linearDelta = Math.sqrt(dx * dx + dy * dy) * 0.25;
      }

      deltaProgress = Math.max(angularDelta, linearDelta);

      lastAngleRef.current = currentAngle;
      lastPosRef.current = { x: clientX, y: clientY };
    }

    if (deltaProgress > 0) {
      setSignal((prev) => {
        const next = Math.min(100, prev + deltaProgress);
        return Math.round(next * 10) / 10;
      });
    }
  };

  const endDrag = () => {
    setIsDragging(false);
    lastAngleRef.current = null;
    lastPosRef.current = null;
    activePointerIdRef.current = null;
  };

  // Determine active transient note key and note content
  const getActiveNote = () => {
    if (state === "ready" || state === "conversation") {
      const line = introMessages.finalSequence[messageIndex];
      if (line === "Think you can find me first?") {
        return {
          key: `seq-${messageIndex}`,
          tone: "mint" as const,
          content: (
            <span>
              Think you can <span className="highlight-wash">find me first</span>?
            </span>
          ),
        };
      }
      if (line === "Let's begin.") {
        return {
          key: `seq-${messageIndex}`,
          tone: "yellow" as const,
          content: (
            <span>
              <span className="highlight-wash">Let&apos;s begin.</span>
            </span>
          ),
        };
      }
      return {
        key: `seq-${messageIndex}`,
        tone: "paper" as const,
        content: <span>&ldquo;{line}&rdquo;</span>,
      };
    }

    if (state === "acquired" || signal >= 100) {
      return {
        key: "acquired",
        tone: "yellow" as const,
        content: (
          <span>
            <span className="highlight-wash">SIGNAL ACQUIRED</span>
          </span>
        ),
      };
    }

    if (signal >= 95) {
      return {
        key: "95",
        tone: "mint" as const,
        content: <span>&ldquo;{introMessages.at95}&rdquo;</span>,
      };
    }

    if (signal >= 88) {
      return {
        key: "88",
        tone: "yellow" as const,
        content: (
          <span>
            I <span className="highlight-wash">SEE YOU</span>.
          </span>
        ),
      };
    }

    if (signal >= 72) {
      return {
        key: "72",
        tone: "paper" as const,
        content: (
          <span>
            <span className="highlight-wash">WAIT.</span>
          </span>
        ),
      };
    }

    if (signal >= 55) {
      return {
        key: "55",
        tone: "paper" as const,
        content: <span>&ldquo;{introMessages.at55}&rdquo;</span>,
      };
    }

    if (signal >= 35) {
      return {
        key: "35",
        tone: "paper" as const,
        content: <span>&ldquo;{introMessages.at35}&rdquo;</span>,
      };
    }

    if (interactiveReady) {
      return {
        key: "transmitting",
        tone: "paper" as const,
        content: <span>&ldquo;{introMessages.initialTransmitting}&rdquo;</span>,
      };
    }

    return {
      key: "searching",
      tone: "paper" as const,
      content: <span className="font-mono text-xs tracking-wider text-[#666666]">{introMessages.searching}</span>,
    };
  };

  const currentNote = getActiveNote();

  // SVG Dial Math for the surrounding signal ring
  const ringSize = 340;
  const radius = 150;
  const strokeWidth = 5;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (signal / 100) * circumference;

  // Knob on circumference
  const angleRad = (signal / 100) * 2 * Math.PI - Math.PI / 2;
  const knobX = ringSize / 2 + normalizedRadius * Math.cos(angleRad);
  const knobY = ringSize / 2 + normalizedRadius * Math.sin(angleRad);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex min-h-[100dvh] w-full flex-col justify-between overflow-y-auto bg-[#090d0b] px-4 py-5 text-white select-none transition-opacity duration-300",
        state === "complete" ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
      style={{ touchAction: "none" }}
    >
      {/* ----------------- 1. BACKGROUND SKETCHBOOK MARKS ----------------- */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
        {/* Top-left sketchbook doodle annotations */}
        <svg
          className="absolute left-4 top-14 h-28 w-28 text-[#22c55e]"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <circle cx="45" cy="45" r="30" strokeDasharray="3 4" />
          <path d="M 45 10 L 45 20 M 45 70 L 45 80 M 10 45 L 20 45 M 70 45 L 80 45" />
          <path d="M 68 25 L 80 15 M 72 15 L 80 15 L 80 23" />
        </svg>

        {/* Bottom-right coordinates & star doodle */}
        <svg
          className="absolute right-4 bottom-16 h-24 w-24 text-[#22c55e]"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M 50 15 L 53 38 L 75 42 L 55 55 L 60 78 L 42 62 L 22 72 L 32 50 L 15 35 L 38 35 Z" />
          <line x1="10" y1="85" x2="90" y2="85" strokeDasharray="2 3" />
        </svg>

        {/* Faint paper graph grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #22c55e 1px, transparent 1px), linear-gradient(to bottom, #22c55e 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ----------------- 2. TOP HEADER ----------------- */}
      <header className="relative z-10 mx-auto flex w-full max-w-lg items-center justify-between border-b border-[#202d24] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#22c55e] anim-blink" />
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#86efac]">
              {introMessages.headerLabel}
            </p>
          </div>
          <h1 className="font-display mt-0.5 text-2xl sm:text-3xl text-white leading-none tracking-[0.04em]">
            MAVELI <span className="highlight-wash">SIGNAL</span>
          </h1>
        </div>

        {/* Subtle Skip Button */}
        <button
          type="button"
          onClick={completeIntro}
          className="flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#9ca3af] hover:text-[#22c55e] transition-colors p-1"
          aria-label="Skip introduction"
        >
          <span>{introMessages.skip}</span>
          <span className="hidden sm:inline text-[9px] text-[#6b7280]">(ESC)</span>
        </button>
      </header>

      {/* ----------------- 3. CENTRAL HERO: MAVELI & SURROUNDING SIGNAL RING ----------------- */}
      <main className="relative z-10 mx-auto my-auto flex w-full max-w-lg flex-col items-center justify-center py-2">
        {/* The entire central composition is the interactive tuning zone */}
        <div
          ref={containerRef}
          onPointerDown={(e) => {
            if (activePointerIdRef.current === null) {
              try {
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              } catch {}
              startDrag(e.clientX, e.clientY, e.pointerId);
            }
          }}
          onPointerMove={(e) => {
            if (activePointerIdRef.current === e.pointerId || activePointerIdRef.current === null) {
              moveDrag(e.clientX, e.clientY);
            }
          }}
          onPointerUp={(e) => {
            try {
              (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
            } catch {}
            endDrag();
          }}
          onPointerCancel={endDrag}
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              startDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 1) {
              moveDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={endDrag}
          onTouchCancel={endDrag}
          className="group relative flex h-[310px] w-[310px] sm:h-[360px] sm:w-[360px] cursor-grab active:cursor-grabbing items-center justify-center touch-none select-none"
          role="slider"
          aria-label="Tune Maveli signal"
          aria-valuenow={Math.round(signal)}
          aria-valuemin={12}
          aria-valuemax={100}
          tabIndex={0}
        >
          {/* Hand-Drawn SVG Signal Rings BEHIND and AROUND Maveli */}
          <svg
            className="absolute inset-0 h-full w-full -rotate-90 pointer-events-none"
            viewBox={`0 0 ${ringSize} ${ringSize}`}
          >
            {/* Outer Sketch Track */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={normalizedRadius}
              fill="none"
              stroke="#202d24"
              strokeWidth="2"
              strokeDasharray="5 4"
              opacity="0.8"
            />

            {/* Inner faint concentric orbit */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r="105"
              fill="none"
              stroke="#22c55e"
              strokeWidth="1"
              strokeDasharray="3 5"
              opacity="0.25"
            />

            {/* Subtle Crosshair Marks */}
            <line
              x1={ringSize / 2}
              y1="20"
              x2={ringSize / 2}
              y2={ringSize - 20}
              stroke="#22c55e"
              strokeWidth="1"
              opacity="0.2"
            />
            <line
              x1="20"
              y1={ringSize / 2}
              x2={ringSize - 20}
              y2={ringSize / 2}
              stroke="#22c55e"
              strokeWidth="1"
              opacity="0.2"
            />

            {/* Active Tuned Arc in FOSS Neon Green */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={normalizedRadius}
              fill="none"
              stroke="#22c55e"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-100 ease-out"
            />

            {/* Rotary Dial Knob on Circumference */}
            {signal < 100 && (
              <circle
                cx={knobX}
                cy={knobY}
                r="8"
                fill="#22c55e"
                stroke="#090d0b"
                strokeWidth="2.5"
                className="drop-shadow-sm"
              />
            )}
          </svg>

          {/* ---- PROMINENT FULL-BODY MAVELI CHARACTER ---- */}
          <div className="relative z-10 flex h-[280px] w-[220px] sm:h-[330px] sm:w-[260px] items-center justify-center pointer-events-none">
            {/* Low signal radar wave placeholder */}
            {signal < 25 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <Radio size={40} className="anim-blink text-[#22c55e]/60" weight="duotone" />
                <span className="mt-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#22c55e]/60">
                  RECEIVING SIGNAL...
                </span>
              </div>
            )}

            {/* Full-Body Maveli Image (Progressive Reveal & Expression Switch) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                signal >= 100
                  ? "/assets/maveli/maveli-full-happy.png"
                  : "/assets/maveli/maveli-full-curious.png"
              }
              alt="King Maveli"
              className={cn(
                "h-full w-full object-contain transition-all duration-200 drop-shadow-md",
                signal >= 100 ? "anim-breathe" : "",
              )}
              style={{
                opacity:
                  signal < 25
                    ? 0
                    : signal < 45
                      ? ((signal - 25) / 20) * 0.5
                      : signal < 70
                        ? 0.5 + ((signal - 45) / 25) * 0.35
                        : signal < 90
                          ? 0.85 + ((signal - 70) / 20) * 0.15
                          : 1,
                transform:
                  signal >= 100
                    ? "scale(1.04)"
                    : signal >= 88
                      ? "scale(1.02) translateY(-2px)"
                      : `scale(${0.92 + (signal / 100) * 0.08})`,
              }}
            />
          </div>

          {/* Swipe guidance badge if player hasn't interacted yet */}
          {!hasInteracted && interactiveReady && signal < 25 && (
            <div
              className={cn(
                "pointer-events-none absolute -bottom-2 z-30 flex items-center gap-1.5 rounded-full border border-[#22c55e]/40 bg-[#14261a] px-3.5 py-1 font-sans text-xs font-bold text-[#22c55e] shadow-sm",
                showIdleHint ? "anim-dial-pulse" : "anim-rise",
              )}
            >
              <HandPointing size={15} weight="fill" className="anim-blink" />
              <span>{showIdleHint ? introMessages.idleReminder : introMessages.prompt}</span>
            </div>
          )}
        </div>

        {/* ----------------- CLEAN TELEMETRY: SIGNAL % ----------------- */}
        <div className="mt-1 flex items-center justify-center">
          <span className="font-mono text-xl sm:text-2xl font-extrabold tracking-wider text-[#22c55e]">
            SIGNAL: {Math.round(signal)}%
          </span>
        </div>
      </main>

      {/* ----------------- 4. MAVELI DIALOGUE NOTE & CTA ----------------- */}
      <footer className="relative z-10 mx-auto w-full max-w-md space-y-3">
        {/* Physically connected Sticky Note with directional pointer to Maveli */}
        <div className="relative">
          {/* Subtle pointer tip pointing UP toward Maveli */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
            <div className="h-3 w-3 rotate-45 border-l border-t border-[#202d24] bg-[#111813]" />
          </div>

          {/* Dialogue Note Body */}
          <div
            key={currentNote.key}
            className="panel rounded-[12px] border border-[#202d24] bg-[#111813] p-4 sm:p-5 text-center transition-all duration-200 shadow-sm anim-note-pop text-white"
            aria-live="polite"
          >
            <p className="font-sans text-base sm:text-lg font-semibold leading-snug text-white">
              {currentNote.content}
            </p>
          </div>
        </div>

        {/* Primary CTA Button */}
        {state === "ready" ? (
          <button
            type="button"
            onClick={completeIntro}
            className="btn btn-primary w-full justify-center text-base py-3.5 shadow-sm anim-rise"
          >
            <Sparkle size={18} weight="fill" />
            <span>→ {introMessages.cta}</span>
          </button>
        ) : (
          <div className="flex items-center justify-center py-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#9ca3af]">
              {signal >= 100 ? "Ready to track" : "Swipe around Maveli to tune"}
            </p>
          </div>
        )}
      </footer>
    </div>
  );
}
