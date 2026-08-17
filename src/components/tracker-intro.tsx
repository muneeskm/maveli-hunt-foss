"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Tracker intro - flat map.
 *
 * The map card shows /campus-map-art.png full-bleed: an accurate hand-made
 * pixel map of Christ College of Engineering. Sighting dots pulse on the
 * real landmarks, Mavelli's pixel avatar wanders a path across the map, the
 * signal goes unstable (avatar blinks), then a "LOCATION NOT FOUND" warning
 * overlays before handing off to "Join the search".
 *
 * The whole sequence is ~3.7s: 2.4s wander + 0.3s unstable blink + 1s of
 * the LOCATION NOT FOUND overlay, then hand off.
 */

type Step = "track" | "blink" | "lost";

const TRACK_MS = 2400;
const BLINK_MS = 300;
const LOST_MS = 1000;

/* sighting dots, positioned on the landmarks of /campus-map-art.png:
   top block, top-right complex, left tower cluster (hot), central plaza
   (hot), middle-left buildings, bottom-right block */
const DOTS: { x: string; y: string; hot?: boolean }[] = [
  { x: "40%", y: "12%" },
  { x: "70%", y: "18%" },
  { x: "24%", y: "34%", hot: true },
  { x: "56%", y: "50%", hot: true },
  { x: "32%", y: "60%" },
  { x: "68%", y: "74%" },
];

export function TrackerIntro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>("track");
  const [elapsed, setElapsed] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // live "last ping" clock for the tracker HUD
  useEffect(() => {
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  // step timers (fallback timers mirror the animation, so reduced-motion
  // users - and anyone - still advance through the sequence)
  useEffect(() => {
    if (step === "track") {
      const t = window.setTimeout(() => setStep("blink"), TRACK_MS);
      return () => window.clearTimeout(t);
    }
    if (step === "blink") {
      const t = window.setTimeout(() => setStep("lost"), BLINK_MS);
      return () => window.clearTimeout(t);
    }
    if (step === "lost") {
      const t = window.setTimeout(() => onDoneRef.current(), LOST_MS);
      return () => window.clearTimeout(t);
    }
  }, [step]);

  const ping = `00:${String(elapsed).padStart(2, "0")}`;

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-ink px-4 pb-8 pt-6"
      onClick={() => step === "lost" && onDone()}
    >
      <div className="mx-auto w-full max-w-md">
        {/* pixel HUD */}
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-moss">
              The Maveli Files
            </p>
            <h1 className="font-pixel mt-2 text-[13px] uppercase tracking-wide text-mist">
              Investigation Tracker
            </h1>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-moss">
            Last ping {ping}
          </p>
        </div>

        {/* ---- tracker map scene ---- */}
        <div className="relative mt-4 h-[72dvh] max-h-[640px] overflow-hidden rounded-2xl border border-line bg-ink-3">
          {/* campus map art (full-bleed, accurate pixel map) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/campus-map-art.png"
            alt="Campus map"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ imageRendering: "pixelated" }}
          />

          {/* sighting dots */}
          {DOTS.map((d, i) => (
            <span
              key={i}
              className={
                d.hot
                  ? "pixel-dot pixel-dot-hot rounded-[1px]"
                  : "pixel-dot rounded-[1px] bg-leaf"
              }
              style={{ left: d.x, top: d.y }}
            />
          ))}

          {/* avatar - anchored so its FEET stand on the tracked point
              (translate(-50%, -100%) centers x and sits the sprite bottom on
              the point), flat shadow ellipse under the feet */}
          <div
            className={
              step === "track"
                ? "intro-track pointer-events-none absolute inset-0"
                : "pointer-events-none absolute inset-0"
            }
            style={
              step === "track" ? undefined : { transform: "translate(50%, 86%)" }
            }
            onAnimationEnd={(e) => {
              if (e.animationName === "mh-track") setStep("blink");
            }}
          >
            <div
              className="absolute left-0 top-0"
              style={{ transform: "translate(-50%, -100%)" }}
            >
              <span className="absolute -bottom-1 left-1/2 h-2.5 w-16 -translate-x-1/2 rounded-[100%] bg-black/55" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mavelli-avatar-pixel.png"
                alt="Mavelli"
                className={
                  step === "blink" || step === "lost"
                    ? "anim-blink block h-16 w-16"
                    : "block h-16 w-16"
                }
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </div>

          {/* speech bubble */}
          <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
            <div className="border-2 border-leaf/60 bg-ink-2 px-3 py-2 text-center">
              <p className="font-pixel text-[8px] leading-relaxed text-leaf">
                SIGHTING IN YOUR
                <br />
                DIRECT VICINITY
              </p>
            </div>
            <div className="mx-auto h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-leaf/60" />
          </div>

          {/* lost overlay (flat, above the map) */}
          {step === "lost" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink/92 px-6 text-center">
              <div className="hazard h-1.5 w-24 rounded-full" />
              <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.24em] text-mist">
                Warning
              </p>
              <h2 className="anim-flicker mt-2 text-2xl font-black uppercase tracking-tight text-leaf">
                Location not found
              </h2>
              <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-fog">
                The signal ended. Mavelli is missing - a search is being
                opened.
              </p>
            </div>
          )}
        </div>

        {/* ---- status line ---- */}
        <div className="mt-4 flex items-center justify-between">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em]">
            <span
              className={
                step === "blink" || step === "lost"
                  ? "anim-blink h-2 w-2 rounded-full bg-leaf"
                  : "h-2 w-2 rounded-full bg-leaf"
              }
            />
            <span className={step === "lost" ? "text-leaf" : "text-fog"}>
              {step === "track"
                ? "Tracking last known position"
                : step === "blink"
                  ? "Signal unstable"
                  : "Location not found"}
            </span>
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-moss">
            {step === "track" ? "Acquiring..." : "Lost"}
          </p>
        </div>
      </div>
    </div>
  );
}
