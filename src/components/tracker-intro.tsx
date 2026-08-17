"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Opening sequence, tracker style.
 *
 * The real campus map (OpenStreetMap capture of Christ College of
 * Engineering, 10.356114, 76.212631) sits on a 2.5D tilted plane. Mavelli's
 * avatar wanders across it (tracking), the signal goes unstable and the
 * avatar blinks, then a "LOCATION NOT FOUND" warning overlays the map.
 * Tap anywhere to skip to the join screen.
 *
 * Assets:
 *   /campus-map.png      - the OSM capture (swap for a newer capture if the
 *                          campus changes; coordinates in the comment above)
 *   /mavelli-avatar.png  - the real Mahabali avatar
 */

type Step = "track" | "blink" | "lost";

const TRACK_MS = 9000; // must match the mh-track animation duration
const BLINK_MS = 2600;
const LOST_MS = 3200;

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
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-moss">
              FOSS Mavelli Hunt
            </p>
            <h1 className="mt-1 text-xl font-bold uppercase tracking-tight text-mist">
              Mavelli tracker
            </h1>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-moss">
            Last ping {ping}
          </p>
        </div>

        {/* ---- campus map (2.5D extruded board on a grid floor) ---- */}
        <div className="relative mt-5 h-[70dvh] max-h-[620px] overflow-hidden rounded-2xl border border-line bg-ink-3">
          <div className="map-tilt absolute inset-0">
            <div className="map-floor" />

            <div className="map-board">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/campus-map.png"
                alt="Campus map"
                className="block h-full w-full object-cover"
              />

              {/* avatar layer - wanders on the map face */}
              <div
                className={
                  step === "track"
                    ? "intro-track pointer-events-none absolute inset-0"
                    : "pointer-events-none absolute inset-0"
                }
                style={
                  step === "track"
                    ? undefined
                    : { transform: "translate(52%, 85%)" }
                }
                onAnimationEnd={(e) => {
                  if (e.animationName === "mh-track") setStep("blink");
                }}
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mavelli-avatar.png"
                    alt="Mavelli"
                    className={
                      step === "blink" || step === "lost"
                        ? "anim-blink h-14 w-14 rounded-full"
                        : "h-14 w-14 rounded-full"
                    }
                  />
                  <span className="absolute -bottom-1 left-1/2 h-2 w-12 -translate-x-1/2 rounded-[100%] bg-black/45" />
                </div>
              </div>

              {/* front slab edge (board thickness) */}
              <div className="map-thickness" />
            </div>
          </div>

          {/* map attribution (OSM tile data) */}
          <p className="pointer-events-none absolute bottom-1.5 right-2.5 z-10 font-mono text-[8px] uppercase tracking-[0.16em] text-moss/70">
            © OpenStreetMap
          </p>

          {/* lost overlay (stays flat above the tilted board) */}
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
