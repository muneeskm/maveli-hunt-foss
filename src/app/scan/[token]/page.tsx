"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  Detective,
  Eye,
  InstagramLogo,
  Leaf,
  Radio,
  Sparkle,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import {
  Btn,
  Chip,
  HighlightWord,
  Panel,
  TaglineBadge,
} from "@/components/ui";
import { ReconstructionGate } from "@/components/gate";
import { useGame, useMounted } from "@/hooks/use-game";
import { store } from "@/lib/store";
import type { ScanResult } from "@/lib/types";

type ViewState =
  | { kind: "checking" }
  | {
      kind: "out_of_order";
      expectedOrder: number;
      expectedLocationName: string;
      targetOrder: number;
      targetLocationName: string;
    }
  | {
      kind: "sighting";
      order: number;
      name: string;
      word: string;
      wordClue: string;
      photoUrl?: string;
      duplicate: boolean;
    }
  | { kind: "sos-locking" }
  | { kind: "sos-alarm" }
  | { kind: "sos-dup" }
  | { kind: "final"; duplicate: boolean }
  | { kind: "unknown" };

export default function ScanTokenPage() {
  const params = useParams<{ token?: string }>();
  const token = typeof params?.token === "string" ? params.token : "";
  const router = useRouter();
  const mounted = useMounted();
  const { team, settings, answers, game, sessionPending } = useGame();
  const [view, setView] = useState<ViewState>({ kind: "checking" });
  const [revealed, setRevealed] = useState(false);
  const [sosAt, setSosAt] = useState<number | null>(null);
  const decided = useRef<{ token: string } | null>(null);

  useEffect(() => {
    if (!mounted) return;
    if (!team && !sessionPending) {
      router.replace(`/?scan=${encodeURIComponent(`/scan/${token}`)}`);
    }
  }, [mounted, team, sessionPending, router, token]);

  useEffect(() => {
    if (!team || !token) return;
    if (decided.current?.token === token) return;

    const run = async () => {
      let v: ViewState = { kind: "unknown" };
      try {
        const res = (await store.recordScan(team.id, token)) as ScanResult;
        if (!res.ok) {
          if (res.reason === "out_of_order") {
            v = {
              kind: "out_of_order",
              expectedOrder: res.expectedOrder,
              expectedLocationName: res.expectedLocationName,
              targetOrder: res.targetOrder,
              targetLocationName: res.targetLocationName,
            };
          } else {
            v = { kind: "unknown" };
          }
        } else if (res.location.type === "sighting") {
          v = {
            kind: "sighting",
            order: res.location.order,
            name: res.location.name,
            word: res.word ?? "",
            wordClue: res.wordClue ?? "",
            photoUrl: res.location.photoUrl,
            duplicate: !!res.duplicate,
          };
        } else if (res.location.type === "sos") {
          if (res.duplicate) {
            v = { kind: "sos-dup" };
          } else {
            v = { kind: "sos-locking" };
            setSosAt(Date.now());
          }
        } else if (res.location.type === "final") {
          v = { kind: "final", duplicate: !!res.duplicate };
        }
      } catch {
        v = { kind: "unknown" };
      }
      decided.current = { token };
      setView(v);
    };

    void run();
  }, [team, token, router]);

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
    <header className="sticky top-3 z-40 mx-auto max-w-md px-4">
      <div className="liquid-glass-subtle flex items-center justify-between gap-2 px-3.5 py-2.5">
        <Link
          href="/tracker"
          className="flex items-center gap-2 font-sans text-xs font-bold text-white"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-white/10 border border-white/20 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/maveli-logo.png"
              alt="Maveli"
              className="h-5 w-5 object-cover"
            />
          </div>
          The Maveli Files
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-[6px] border border-white/15 bg-white/5 px-2.5 py-1 font-sans text-xs font-medium text-white hover:bg-white/10 transition-colors"
        >
          Leaderboard
        </Link>
      </div>
    </header>
  );

  const bgLayer = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mobile-bg.png"
      alt=""
      aria-hidden="true"
      className="bg-mobile-layer"
    />
  );

  if (view.kind === "checking") {
    return (
      <div className="relative min-h-screen bg-[#020712] text-white overflow-x-hidden">
        {bgLayer}
        <div className="relative z-10">
          {bar}
          <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
            <div className="liquid-glass-subtle flex h-16 w-16 items-center justify-center rounded-full">
              <Radio size={28} className="anim-blink text-[#22c55e]" />
            </div>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-[#22c55e]">
              Decoding campus evidence...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view.kind === "out_of_order") {
    return (
      <div className="relative min-h-screen bg-[#020712] text-white overflow-x-hidden">
        {bgLayer}
        <div className="relative z-10">
          {bar}
          <main className="mx-auto flex min-h-[calc(100vh-70px)] max-w-md flex-col justify-center px-5 py-8">
            <div className="text-center">
              <TaglineBadge className="mx-auto mb-3">
                <WarningCircle size={14} weight="bold" /> OUT OF SEQUENCE
              </TaglineBadge>
              <h1 className="font-display text-3xl sm:text-4xl text-white drop-shadow-md">
                Whoa there, <HighlightWord>Time Traveler!</HighlightWord> ⏳
              </h1>
            </div>

            <Panel className="mt-6 p-6 text-center">
              <p className="font-mono text-xs uppercase tracking-wider text-[#86efac]">
                Sequence Check
              </p>
              <p className="mt-3 font-sans text-sm leading-relaxed text-white">
                You just scanned <strong>{view.targetLocationName}</strong> (Node 0{view.targetOrder}),
                but your squad hasn&apos;t uncovered{" "}
                <strong>Sighting 0{view.expectedOrder}</strong> ({view.expectedLocationName}) yet!
              </p>

              <div className="liquid-glass-subtle mt-4 p-3 text-xs italic text-[#86efac]">
                💡 Maveli says: &quot;Hold your horses! My footprints move forward in time,
                not quantum entanglement. Follow the trail in sequence!&quot;
              </div>
            </Panel>

            <div className="mt-6 space-y-3">
              <Btn onClick={continueTracker} className="w-full justify-center text-base py-3.5 shadow-xl">
                <span>Head to Sighting 0{view.expectedOrder}</span>
                <ArrowRight size={18} />
              </Btn>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (view.kind === "unknown") {
    return (
      <div className="relative min-h-screen bg-[#020712] text-white overflow-x-hidden">
        {bgLayer}
        <div className="relative z-10">
          {bar}
          <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
            <div className="liquid-glass-subtle flex h-16 w-16 items-center justify-center rounded-full border-red-500/30">
              <XCircle size={32} className="text-red-400" />
            </div>
            <h1 className="font-display mt-4 text-2xl text-white drop-shadow-md">
              Not a Hunt Marker
            </h1>
            <p className="mx-auto mt-2 max-w-[32ch] font-sans text-xs text-[#cbd5e1] drop-shadow-sm">
              This code does not belong to The Maveli Files. Check the physical landmark marker and try again.
            </p>
            <Btn onClick={continueTracker} className="mt-6 shadow-xl">
              Back to Tracker
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  if (view.kind === "sighting") {
    const isFirst = !view.duplicate;
    return (
      <div className="relative min-h-screen bg-[#020712] text-white overflow-x-hidden">
        {bgLayer}
        <div className="relative z-10">
          {bar}
          <main className="mx-auto flex min-h-[calc(100vh-70px)] max-w-md flex-col justify-center px-5 py-8">
            <div className="text-center">
              <TaglineBadge className="mx-auto mb-3">
                <Sparkle weight="fill" size={13} />
                {isFirst ? "EVIDENCE RECOVERED" : "ALREADY RECOVERED"}
              </TaglineBadge>
              <h1 className="font-display text-3xl sm:text-4xl text-white drop-shadow-md">
                {view.name}
              </h1>
            </div>

            {view.photoUrl && (
              <div className="relative mt-5 aspect-video w-full overflow-hidden rounded-[18px] border border-white/20 shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={view.photoUrl}
                  alt={view.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <Panel className="mt-5 p-6 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-[#86efac]">
                Decrypted Word 0{view.order}
              </p>
              {revealed ? (
                <div className="anim-mask mt-3">
                  <p className="font-mono text-4xl font-extrabold tracking-widest text-[#22c55e] drop-shadow-md">
                    {view.word || "RECORDED"}
                  </p>
                  {view.wordClue && (
                    <p className="mx-auto mt-3 max-w-[36ch] font-sans text-xs leading-relaxed text-[#cbd5e1]">
                      {view.wordClue}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="mt-3 select-none font-mono text-4xl font-bold tracking-widest text-[#86efac]">
                    •••••
                  </p>
                  <Btn
                    variant="outline"
                    onClick={() => setRevealed(true)}
                    className="mt-4 border-white/20 bg-white/5 text-[#22c55e] hover:bg-white/10"
                  >
                    <Eye size={16} /> Reveal Word
                  </Btn>
                </>
              )}
            </Panel>

            {/* Instagram Spotlight Card if Cake Farm Cafe (order 2) */}
            {view.order === 2 && (
              <div className="liquid-glass mt-5 p-5 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-[#020712]">
                    <InstagramLogo size={24} weight="fill" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-sans text-base font-bold text-white">
                        Maveli&apos;s Instagram Transmission
                      </h3>
                      <span className="rounded-[4px] bg-[#22c55e] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#020712]">
                        CRITICAL
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#cbd5e1]">
                      Maveli is transmitting updates via his Instagram profile (<strong>@maveli.thamburan_</strong>). Track his latest posts and stories to uncover his next destination and timestamp clues.
                    </p>
                    <a
                      href="https://www.instagram.com/maveli.thamburan_?igsh=MWo1ZW5mc3h3bTllOA==&igsi=MWo1ZW5mc3h3bTllOA=="
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary mt-3 flex w-full items-center justify-center gap-2 text-xs font-bold py-2.5 shadow-lg"
                    >
                      <InstagramLogo size={16} weight="fill" />
                      <span>Open @maveli.thamburan_ on Instagram ↗</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Day 1 Completion & Night Story Announcement Card (order 4) */}
            {view.order === 4 && (
              <div className="liquid-glass mt-5 p-5 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#38bdf8] text-[#020712]">
                    <InstagramLogo size={24} weight="fill" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-sans text-base font-bold text-white">
                        Day 1 Complete · Watch Tonight&apos;s Story! 🌙
                      </h3>
                      <span className="rounded-[4px] bg-[#38bdf8] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#020712]">
                        NIGHT EVENT
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#cbd5e1]">
                      You&apos;ve completed all Day 1 checkpoints! Maveli has gone underground for the night. <strong>Be sure to watch Maveli&apos;s Instagram Story (@maveli.thamburan_) tonight between 19:00 and 00:00</strong> for emergency signals and clues for Day 2.
                    </p>
                    <a
                      href="https://www.instagram.com/maveli.thamburan_?igsh=MWo1ZW5mc3h3bTllOA==&igsi=MWo1ZW5mc3h3bTllOA=="
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary mt-3 flex w-full items-center justify-center gap-2 text-xs font-bold py-2.5 shadow-lg"
                    >
                      <InstagramLogo size={16} weight="fill" />
                      <span>Follow @maveli.thamburan_ for Night Stories ↗</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-4 text-center font-sans text-xs text-[#cbd5e1] drop-shadow-sm">
              {isFirst
                ? "✓ Checkpoint automatically logged to your squad's Evidence Board & Leaderboard!"
                : "Your squad already recorded this sighting. Continue to the next node."}
            </p>

            <Btn onClick={continueTracker} className="mt-6 w-full justify-center text-base py-3.5 shadow-xl">
              <span>Continue to Tracker</span>
              <ArrowRight size={18} />
            </Btn>
          </main>
        </div>
      </div>
    );
  }

  if (view.kind === "sos-locking") {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#020712] px-6 text-center text-white overflow-x-hidden">
        {bgLayer}
        <div className="relative z-10">
          <div className="liquid-glass-subtle mx-auto flex h-20 w-20 items-center justify-center rounded-full">
            <Radio size={36} className="anim-blink text-[#22c55e]" />
          </div>
          <h1 className="font-display mt-6 text-3xl text-white drop-shadow-md">
            Signal Locking...
          </h1>
          <p className="mx-auto mt-2 max-w-[34ch] font-sans text-xs text-[#cbd5e1]">
            Stay in the vicinity. The transmission packet is resolving...
          </p>
        </div>
      </div>
    );
  }

  if (view.kind === "sos-alarm") {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#020712] px-6 py-10 text-center text-white overflow-x-hidden">
        {bgLayer}
        <div className="relative z-10 w-full max-w-sm">
          <TaglineBadge className="mx-auto mb-3">
            EMERGENCY ALERT
          </TaglineBadge>
          <h1 className="font-display mt-2 text-3xl sm:text-4xl text-white drop-shadow-md">
            Maveli SOS Detected!
          </h1>
          <Panel className="mt-6 w-full p-5 text-left">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <CheckCircle size={18} weight="fill" className="shrink-0 text-[#22c55e]" />
              <p className="font-sans text-xs font-bold text-white">Transmission Received</p>
            </div>
            <p className="mt-3 font-sans text-xs leading-relaxed text-[#cbd5e1]">
              Maveli is alive, but trapped. He has been broadcasting on an offline channel. The next clue tells you where he is sheltered.
            </p>
          </Panel>
          <Btn onClick={continueTracker} className="mt-6 w-full justify-center text-base py-3.5 shadow-xl">
            <span>Follow the SOS</span>
            <ArrowRight size={18} />
          </Btn>
        </div>
      </div>
    );
  }

  if (view.kind === "sos-dup") {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#020712] px-6 text-center text-white overflow-x-hidden">
        {bgLayer}
        <div className="relative z-10">
          <div className="liquid-glass-subtle mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle size={32} className="text-[#22c55e]" />
          </div>
          <h1 className="font-display mt-4 text-2xl text-white drop-shadow-md">
            SOS Already Received
          </h1>
          <p className="mx-auto mt-2 max-w-[34ch] font-sans text-xs text-[#cbd5e1]">
            Your squad already recovered this transmission. The next clue is ready in the tracker.
          </p>
          <Btn onClick={continueTracker} className="mt-6 shadow-xl">
            Go to Tracker <ArrowRight size={16} />
          </Btn>
        </div>
      </div>
    );
  }

  // final
  const solved =
    answers.some((a) => a.kind === "reconstruction" && a.correct) ||
    game.winnerTeamId === team.id;

  return (
    <div className="relative min-h-screen bg-[#020712] text-white overflow-x-hidden">
      {bgLayer}
      <div className="relative z-10">
        {bar}
        <main className="mx-auto max-w-md px-5 py-8">
          {solved ? (
            <div className="py-10 text-center">
              <div className="liquid-glass-subtle mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <Leaf size={36} weight="fill" className="text-[#22c55e]" />
              </div>
              <h1 className="font-display mt-4 text-3xl text-white drop-shadow-md">
                Maveli is Safe!
              </h1>
              <p className="mx-auto mt-2 max-w-[34ch] font-sans text-xs text-[#cbd5e1]">
                Your squad proved the final instruction. The hunt is complete.
              </p>
              <Btn onClick={continueTracker} className="mt-6 w-full justify-center text-base py-3.5 shadow-xl">
                <span>Continue</span>
                <ArrowRight size={18} />
              </Btn>
            </div>
          ) : (
            <div className="space-y-5">
              <Panel className="p-6 text-center">
                <Detective size={32} weight="bold" className="mx-auto text-[#22c55e]" />
                <h1 className="font-display mt-2 text-2xl text-white">
                  You Found the Sanctuary
                </h1>
                <p className="mx-auto mt-2 max-w-[36ch] font-sans text-xs leading-relaxed text-[#cbd5e1]">
                  Maveli is here. The final marker demands proof. Reconstruct the instruction from your five words in exact order.
                </p>
                {view.duplicate && (
                  <p className="liquid-glass-subtle mt-3 flex items-start justify-center gap-2 p-2 text-xs text-[#cbd5e1]">
                    <WarningCircle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                    This marker was already scanned by your squad.
                  </p>
                )}
              </Panel>
              <ReconstructionGate />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
