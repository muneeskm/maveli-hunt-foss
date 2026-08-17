"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Scan, X } from "@phosphor-icons/react";
import { Btn } from "@/components/ui";

type Detector = {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
};
type WindowWithDetector = Window & {
  BarcodeDetector?: new (options?: { formats?: string[] }) => Detector;
};

/*
 * In-app QR scanning via the native BarcodeDetector API (Chrome / Android,
 * Safari 17+). When unsupported, the overlay explains how to scan with the
 * camera app instead - scanning is never a hard requirement, just faster.
 */
export function QRScannerButton({ label = "Scan the QR with camera" }: { label?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);

  const supported =
    typeof window !== "undefined" && "BarcodeDetector" in window;

  const stop = () => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = async () => {
    setError(null);
    setOpen(true);
    if (!supported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();

      const Detector = (window as WindowWithDetector).BarcodeDetector!;
      const detector = new Detector({ formats: ["qr_code"] });
      runningRef.current = true;
      const tick = async () => {
        if (!runningRef.current) return;
        if (video.readyState >= 2) {
          try {
            const codes = await detector.detect(video);
            for (const code of codes) {
              const raw = code.rawValue;
              if (raw.includes("/scan/")) {
                stop();
                setOpen(false);
                router.push(raw.slice(raw.indexOf("/scan/")));
                return;
              }
            }
          } catch {
            // frame not ready yet, keep scanning
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError("Camera unavailable. Use your camera app to scan the QR instead.");
    }
  };

  const close = () => {
    stop();
    setOpen(false);
  };

  useEffect(() => close, []);

  return (
    <>
      <Btn onClick={start} className="w-full">
        <Scan size={20} /> {label}
      </Btn>
      {open && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-fog">
              Point at the QR code
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close scanner"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-fog hover:text-mist"
            >
              <X size={22} />
            </button>
          </div>
          <div className="relative mx-4 flex-1 overflow-hidden rounded-2xl border border-line bg-ink-3">
            {supported ? (
              <>
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
                <div className="scanline" />
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <Camera size={40} className="text-moss" />
                <p className="text-sm leading-relaxed text-fog">
                  Your browser cannot scan QR codes directly. Open your camera
                  app and point it at the QR on the evidence marker.
                </p>
              </div>
            )}
          </div>
          {error && <p className="px-6 py-3 text-sm text-red-300">{error}</p>}
        </div>
      )}
    </>
  );
}
