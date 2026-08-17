"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  Detective,
  Eye,
  Leaf,
  Radio,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { Btn, Panel } from "@/components/ui";
import { ReconstructionGate } from "@/components/gate";
import { useGame } from "@/hooks/use-game";
import { store } from "@/lib/store";
import { cn } from "@/lib/utils";

type ScanView =
  | { kind: "checking" }
  | { kind: "unknown" }
  | {
      kind: "out_of_order";
      expectedOrder: number;
      expectedLocationName: string;
      targetOrder: number;
      targetLocationName: string;
    }
  | {
      kind: "sighting";
      word: string;
      wordClue: string;
      name: string;
      order: number;
      photoUrl?: string;
      duplicate: boolean;
    }
  | { kind: "sos-locking" }
  | { kind: "sos-alarm" }
  | { kind: "sos-dup" }
  | { kind: "final"; duplicate: boolean };

/*
 * Destination of every location QR. Records the scan server-side (first scan
 * per team wins), then plays the appropriate reveal:
 *  - sighting: EVIDENCE RECOVERED, masked word, Mavelli's line
 *  - sos: signal lock, then the SOS alarm
 *  - final: the reconstruction gate (type the five words in order)
 */
export default function ScanPage() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const router = useRouter();
  const { team, game, settings, answers } = useGame();
  const [view, setView] = useState<ScanView>({ kind: "checking" });
  const [sosAt, setSosAt] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(true);
  const decided = useRef<{ token: string } | null>(null);
  const inFlight = useRef<string | null>(null);

  // Decide the view once per token.
  useEffect(() => {
    if (!team) {
      router.replace(`/?scan=${encodeURIComponent(`/scan/${token}`)}`);
      return;
    }
    if (decided.current?.token === token) return;
    if (inFlight.current === token) return;
    inFlight.current = token;

    const run = async () => {
      const loc = store.locationByToken(token);
      if (!loc) {
        setView({ kind: "unknown" });
        decided.current = { token };
        return;
      }

      const res = await store.recordScan(team.id, token);

      let v: ScanView;
      if (!res.ok && res.reason === "out_of_order") {
        v = {
          kind: "out_of_order",
          expectedOrder: res.expectedOrder,
          expectedLocationName: res.expectedLocationName,
          targetOrder: res.targetOrder,
          targetLocationName: res.targetLocationName,
        };
      } else if (loc.type === "sighting") {
        v = {
          kind: "sighting",
          word: res.ok && res.word ? res.word : (loc.word || ""),
          wordClue: res.ok && res.wordClue ? res.wordClue : (loc.wordClue || ""),
          name: loc.name,
          order: loc.order,
          photoUrl: loc.photoUrl,
          duplicate: !res.ok && res.reason === "duplicate",
        };
      } else if (loc.type === "sos") {
        v = res.ok ? { kind: "sos-locking" } : { kind: "sos-dup" };
        if (v.kind === "sos-locking") setSosAt(Date.now());
      } else {
        v = { kind: "final", duplicate: !res.ok && res.reason === "duplicate" };
      }

      decided.current = { token };
      setView(v);
    };

    void run();
  }, [team, token, router]);

  // SOS drama: lock the signal for sosLockSeconds, then raise the alarm.
  useEffect(() => {
    if (sosAt === null) return;
    const seconds = Math.max(1, settings.sosLockSeconds);
    const t = window.setTimeout(
      () => setView({ kind: "sos-alarm" }),
      seconds * 1000 - Math.min(Date.now() - sosAt, seconds * 1000),
    );
    return () => window.clearTimeout(t);
  }, [sosAt, settings.sosLockSeconds]);

  if (!team) return null;

  const continueTracker = () => router.push("/tracker");

  const bar = (
    <header className="border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Link
          href="/tracker"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-leaf"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/maveli-logo.png"
            alt="The Maveli Files"
            className="h-6 w-6 rounded-full border border-line-2 object-cover"
          />
          The Maveli Files
        </Link>
        <Link
          href="/leaderboard"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-fog hover:text-mist"
        >
          Leaderboard
        </Link>
      </div>
    </header>
  );

  if (view.kind === "checking") {
    return (
      <div className="min-h-[100dvh] bg-ink">
        {bar}
        <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
          <Radio size={36} className="anim-blink text-leaf" />
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-fog">
            Decoding evidence...
          </p>
        </div>
      </div>
    );
  }

  if (view.kind === "out_of_order") {
    return (
      <div className="min-h-[100dvh] bg-ink">
        {bar}
        <main className="mx-auto flex min-h-[calc(100dvh-57px)] max-w-md flex-col justify-center px-5 py-10">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
              <WarningCircle size={15} weight="bold" /> Out of Order
            </span>
            <h1 className="mt-4 text-2xl font-black uppercase tracking-tight text-mist sm:text-3xl">
              Whoa there, Time Traveler! ⏳
            </h1>
          </div>

          <Panel className="mt-6 border-amber-500/30 bg-ink-2 p-6 text-center shadow-lg">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-moss">
              Sequence Error
            </p>
            <p className="mt-3 text-base leading-relaxed text-mist">
              You just scanned{" "}
              <strong className="text-amber-300">{view.targetLocationName}</strong>{" "}
              (Node 0{view.targetOrder}), but you haven&apos;t uncovered{" "}
              <strong className="text-leaf">Sighting 0{view.expectedOrder}</strong>{" "}
              ({view.expectedLocationName}) yet!
            </p>

            <div className="mt-4 rounded-lg border border-line bg-ink-3 p-3.5 text-xs italic text-fog">
              💡 Maveli says: &quot;Hold your horses! My footprints move forward in
              time, not quantum entanglement. Follow the trail in sequence!&quot;
            </div>
          </Panel>

          <div className="mt-6 space-y-3">
            <Btn onClick={continueTracker} className="w-full">
              Head to Sighting 0{view.expectedOrder} <ArrowRight size={18} />
            </Btn>
          </div>
        </main>
      </div>
    );
  }

  if (view.kind === "unknown") {
    return (
      <div className="min-h-[100dvh] bg-ink">
        {bar}
        <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
          <XCircle size={40} className="text-red-400" />
          <h1 className="mt-4 text-xl font-black uppercase tracking-tight text-mist">
            Not a hunt QR
          </h1>
          <p className="mx-auto mt-2 max-w-[32ch] text-sm text-fog">
            This code does not belong to The Maveli Files. Check the marker and
            try again.
          </p>
          <Btn onClick={continueTracker} className="mt-6">
            Back to the tracker
          </Btn>
        </div>
      </div>
    );
  }

  if (view.kind === "sighting") {
    const isFirst = !view.duplicate;
    return (
      <div className="min-h-[100dvh] bg-ink">
        {bar}
        <main className="mx-auto flex min-h-[calc(100dvh-57px)] max-w-md flex-col justify-center px-5 py-10">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-leaf/40 bg-leaf/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-leaf">
              <span className="h-2 w-2 rounded-full bg-leaf" />
              {isFirst ? "Evidence Recovered" : "Already Recovered"}
            </span>
            <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-mist sm:text-3xl">
              {view.name}
            </h1>
          </div>

          {view.photoUrl && (
            <div className="relative mt-5 aspect-video w-full overflow-hidden rounded-xl border border-line-2 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={view.photoUrl}
                alt={view.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            </div>
          )}

          <Panel className="mt-5 p-6 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fog">
              Decrypted Word 0{view.order}
            </p>
            {revealed ? (
              <div className="anim-mask mt-3">
                <p className="font-mono text-4xl font-black tracking-[0.24em] text-leaf">
                  {view.word || "RECORDED"}
                </p>
                {view.wordClue && (
                  <p className="mx-auto mt-3 max-w-[36ch] text-sm leading-relaxed text-fog">
                    {view.wordClue}
                  </p>
                )}
              </div>
            ) : (
              <>
                <p className="mt-3 select-none font-mono text-4xl font-black tracking-[0.24em] text-mist">
                  •••••
                </p>
                <Btn
                  variant="ghost"
                  onClick={() => setRevealed(true)}
                  className="mt-4"
                >
                  <Eye size={18} /> Reveal word
                </Btn>
              </>
            )}
          </Panel>

          <p className="mt-4 text-center text-sm leading-relaxed text-fog">
            {isFirst
              ? "Word automatically saved to your squad's Evidence Board!"
              : "Your team already recovered this evidence. Continue to the next node."}
          </p>

          <Btn onClick={continueTracker} className="mt-6">
            Continue to Tracker <ArrowRight size={18} />
          </Btn>
        </main>
      </div>
    );
  }

  if (view.kind === "sos-locking") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-black px-6 text-center">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <span className="anim-ping-ring absolute inset-0 rounded-full border-2 border-leaf/40" />
          <Radio size={44} className="anim-blink text-leaf" />
        </div>
        <h1 className="mt-8 font-mono text-2xl font-black uppercase tracking-[0.2em] text-leaf">
          Signal locking
        </h1>
        <p className="mx-auto mt-3 max-w-[34ch] text-sm leading-relaxed text-fog">
          Stay in the area. The transmission is resolving...
        </p>
      </div>
    );
  }

  if (view.kind === "sos-alarm") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-black px-6 py-10 text-center">
        <div className="hazard h-2 w-full max-w-xs rounded-full" />
        <div className="mt-8">
          <span className="anim-blink inline-block h-4 w-4 rounded-full bg-red-500" />
        </div>
        <h1 className="anim-flicker mt-5 font-mono text-4xl font-black uppercase tracking-[0.14em] text-leaf">
          Mavelli SOS
          <br />
          detected
        </h1>
        <Panel className="mt-8 w-full max-w-sm border-leaf/40 p-5">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} weight="fill" className="shrink-0 text-leaf" />
            <p className="font-semibold text-mist">Transmission received</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-fog">
            Mavelli is alive, but trapped. He has been broadcasting on a
            channel called BitChat. The next message tells you where he is
            hiding.
          </p>
        </Panel>
        <Btn onClick={continueTracker} className="mt-6">
          Follow the SOS <ArrowRight size={18} />
        </Btn>
      </div>
    );
  }

  if (view.kind === "sos-dup") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-black px-6 text-center">
        <CheckCircle size={40} weight="fill" className="text-leaf" />
        <h1 className="mt-4 text-xl font-black uppercase tracking-tight text-mist">
          SOS already received
        </h1>
        <p className="mx-auto mt-2 max-w-[34ch] text-sm text-fog">
          Your team already recovered the transmission. The BitChat channel is
          waiting in the tracker.
        </p>
        <Btn onClick={continueTracker} className="mt-6">
          Go to the tracker <ArrowRight size={18} />
        </Btn>
      </div>
    );
  }

  // final
  const solved =
    answers.some((a) => a.kind === "reconstruction" && a.correct) ||
    game.winnerTeamId === team.id;

  return (
    <div className="min-h-[100dvh] bg-ink">
      {bar}
      <main className="mx-auto max-w-md px-5 py-10">
        {solved ? (
          <div className="py-10 text-center">
            <Leaf size={48} weight="fill" className="mx-auto text-leaf" />
            <h1 className="mt-4 text-3xl font-black uppercase tracking-tight text-mist">
              Mavelli is safe
            </h1>
            <p className="mx-auto mt-3 max-w-[34ch] text-sm leading-relaxed text-fog">
              Your team proved the final instruction. The hunt is complete.
            </p>
            <Btn onClick={continueTracker} className="mt-6">
              Continue <ArrowRight size={18} />
            </Btn>
          </div>
        ) : (
          <div className="space-y-5">
            <Panel className="border-leaf/40 p-5 text-center">
              <Detective size={26} className="mx-auto text-leaf" />
              <h1 className="mt-2 text-xl font-black uppercase tracking-tight text-mist">
                You found the hiding place
              </h1>
              <p className="mx-auto mt-2 max-w-[36ch] text-sm leading-relaxed text-fog">
                Mavelli is here. The final marker demands proof. Reconstruct
                the instruction from your five words, in exact order.
              </p>
              {view.duplicate && (
                <p className="mt-3 flex items-start justify-center gap-2 text-xs text-fog">
                  <WarningCircle size={16} className="mt-0.5 shrink-0" />
                  This marker was already scanned by your team.
                </p>
              )}
            </Panel>
            <ReconstructionGate />
          </div>
        )}
      </main>
    </div>
  );
}
