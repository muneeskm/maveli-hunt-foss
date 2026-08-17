"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Opening sequence, tracker style - flat pixel-art map.
 *
 * The map card shows a full-bleed image (/campus-map-art.png) that the event
 * team provides: a fictional pixel-art campus map, portrait 3:5 (e.g.
 * 1080x1800px), drawn to match the black/green tracker theme. Sighting dots
 * pulse on top, Mavelli's pixel avatar wanders across the map, then the
 * signal goes unstable (avatar blinks), and a "LOCATION NOT FOUND" warning
 * overlays the map before handing off to "Join the search".
 *
 * Assets:
 *   /campus-map-art.png      - user-provided map art (1080x1800px, 3:5)
 *   /mavelli-avatar-pixel.png - pixelated Mahabali avatar (transparent bg)
 */

type Step = "track" | "blink" | "lost";

const TRACK_MS = 9000; // must match the mh-track animation duration
const BLINK_MS = 2600;
const LOST_MS = 3200;

/* wander waypoints, as % of the map card (avatar's feet land on each point) */
const DOTS: { x: string; y: string; hot?: boolean }[] = [
  { x: "38%", y: "40%" },
  { x: "58%", y: "34%" },
  { x: "30%", y: "55%", hot: true },
  { x: "66%", y: "52%" },
  { x: "45%", y: "68%" },
  { x: "56%", y: "62%", hot: true },
];

export function TrackerIntro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>("track");
  const [elapsed, setElapsed] = useState(0);
  // keep onDone in a ref so the step timers are never cleared by re-renders
  // (the parent re-creates the callback identity on its own re-renders)
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // live "last ping" clock for the tracker HUD
  useEffect(() => {
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    // fallback timer mirrors the animation so reduced-motion users (where
    // animationend never fires) still advance through the sequence
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
              FOSS Mavelli Hunt
            </p>
            <h1 className="font-pixel mt-2 text-[13px] uppercase tracking-wide text-mist">
              Mavelli tracker
            </h1>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-moss">
            Last ping {ping}
          </p>
        </div>

        {/* ---- tracker map scene ---- */}
        <div className="relative mt-4 h-[72dvh] max-h-[640px] overflow-hidden rounded-2xl border border-line bg-ink-3">
          {/* map art (full-bleed, user-provided) */}
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
