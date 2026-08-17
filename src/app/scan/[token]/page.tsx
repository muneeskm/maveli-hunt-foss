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
      <div className="flex items-center justify-between gap-2 rounded-[16px] border border-[#b6b6b6] bg-[#fcfaf5]/95 px-3.5 py-2.5 backdrop-blur-md shadow-sm">
        <Link
          href="/tracker"
          className="flex items-center gap-2 font-sans text-xs font-bold text-[#1a3300]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#ffe95c] border border-[rgba(26,51,0,0.15)] overflow-hidden">
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
          className="rounded-[6px] border border-[#b6b6b6] bg-white px-2.5 py-1 font-sans text-xs font-medium text-[#1a3300] hover:bg-[#f1f1f1]"
        >
          Leaderboard
        </Link>
      </div>
    </header>
  );

  if (view.kind === "checking") {
    return (
      <div className="min-h-[100dvh] bg-[#fcfaf5]">
        {bar}
        <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ffe95c]">
            <Radio size={28} className="anim-blink text-[#1a3300]" />
          </div>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-[#1a3300]">
            Decoding campus evidence...
          </p>
        </div>
      </div>
    );
  }

  if (view.kind === "out_of_order") {
    return (
      <div className="min-h-[100dvh] bg-[#fcfaf5]">
        {bar}
        <main className="mx-auto flex min-h-[calc(100dvh-70px)] max-w-md flex-col justify-center px-5 py-8">
          <div className="text-center">
            <TaglineBadge className="mx-auto mb-3">
              <WarningCircle size={14} weight="bold" /> OUT OF SEQUENCE
            </TaglineBadge>
            <h1 className="font-display text-3xl sm:text-4xl text-[#1a3300]">
              Whoa there, <HighlightWord>Time Traveler!</HighlightWord> ⏳
            </h1>
          </div>

          <Panel tone="yellow" className="mt-6 p-6 text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-[#1a3300]/80">
              Sequence Check
            </p>
            <p className="mt-3 font-sans text-sm leading-relaxed text-[#1a3300]">
              You just scanned <strong>{view.targetLocationName}</strong> (Node 0{view.targetOrder}),
              but your squad hasn&apos;t uncovered{" "}
              <strong>Sighting 0{view.expectedOrder}</strong> ({view.expectedLocationName}) yet!
            </p>

            <div className="mt-4 rounded-[8px] border border-[rgba(26,51,0,0.15)] bg-white/80 p-3 text-xs italic text-[#1a3300]">
              💡 Maveli says: &quot;Hold your horses! My footprints move forward in time,
              not quantum entanglement. Follow the trail in sequence!&quot;
            </div>
          </Panel>

          <div className="mt-6 space-y-3">
            <Btn onClick={continueTracker} className="w-full justify-center text-base py-3.5">
              <span>Head to Sighting 0{view.expectedOrder}</span>
              <ArrowRight size={18} />
            </Btn>
          </div>
        </main>
      </div>
    );
  }

  if (view.kind === "unknown") {
    return (
      <div className="min-h-[100dvh] bg-[#fcfaf5]">
        {bar}
        <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <XCircle size={32} className="text-red-700" />
          </div>
          <h1 className="font-display mt-4 text-2xl text-[#1a3300]">
            Not a Hunt Marker
          </h1>
          <p className="mx-auto mt-2 max-w-[32ch] font-sans text-xs text-[#666666]">
            This code does not belong to The Maveli Files. Check the physical landmark marker and try again.
          </p>
          <Btn onClick={continueTracker} className="mt-6">
            Back to Tracker
          </Btn>
        </div>
      </div>
    );
  }

  if (view.kind === "sighting") {
    const isFirst = !view.duplicate;
    return (
      <div className="min-h-[100dvh] bg-[#fcfaf5]">
        {bar}
        <main className="mx-auto flex min-h-[calc(100dvh-70px)] max-w-md flex-col justify-center px-5 py-8">
          <div className="text-center">
            <TaglineBadge className="mx-auto mb-3">
              <Sparkle weight="fill" size={13} />
              {isFirst ? "EVIDENCE RECOVERED" : "ALREADY RECOVERED"}
            </TaglineBadge>
            <h1 className="font-display text-3xl sm:text-4xl text-[#1a3300]">
              {view.name}
            </h1>
          </div>

          {view.photoUrl && (
            <div className="relative mt-5 aspect-video w-full overflow-hidden rounded-[14px] border border-[#b6b6b6] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={view.photoUrl}
                alt={view.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <Panel tone="yellow" className="mt-5 p-6 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-[#1a3300]/80">
              Decrypted Word 0{view.order}
            </p>
            {revealed ? (
              <div className="anim-mask mt-3">
                <p className="font-mono text-4xl font-extrabold tracking-widest text-[#1a3300]">
                  {view.word || "RECORDED"}
                </p>
                {view.wordClue && (
                  <p className="mx-auto mt-3 max-w-[36ch] font-sans text-xs leading-relaxed text-[#1a3300]/80">
                    {view.wordClue}
                  </p>
                )}
              </div>
            ) : (
              <>
                <p className="mt-3 select-none font-mono text-4xl font-bold tracking-widest text-[#1a3300]/70">
                  •••••
                </p>
                <Btn
                  variant="outline"
                  onClick={() => setRevealed(true)}
                  className="mt-4 bg-white"
                >
                  <Eye size={16} /> Reveal Word
                </Btn>
              </>
            )}
          </Panel>

          <p className="mt-4 text-center font-sans text-xs text-[#666666]">
            {isFirst
              ? "✓ Word automatically logged to your squad's Evidence Board!"
              : "Your squad already recorded this sighting. Continue to the next node."}
          </p>

          <Btn onClick={continueTracker} className="mt-6 w-full justify-center text-base py-3.5">
            <span>Continue to Tracker</span>
            <ArrowRight size={18} />
          </Btn>
        </main>
      </div>
    );
  }

  if (view.kind === "sos-locking") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#fcfaf5] px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ffe95c]">
          <Radio size={36} className="anim-blink text-[#1a3300]" />
        </div>
        <h1 className="font-display mt-6 text-3xl text-[#1a3300]">
          Signal Locking...
        </h1>
        <p className="mx-auto mt-2 max-w-[34ch] font-sans text-xs text-[#666666]">
          Stay in the vicinity. The transmission packet is resolving...
        </p>
      </div>
    );
  }

  if (view.kind === "sos-alarm") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#fcfaf5] px-6 py-10 text-center">
        <TaglineBadge className="mx-auto mb-3">
          EMERGENCY ALERT
        </TaglineBadge>
        <h1 className="font-display mt-2 text-3xl sm:text-4xl text-[#1a3300]">
          Maveli SOS Detected!
        </h1>
        <Panel tone="mint" className="mt-6 w-full max-w-sm p-5 text-left">
          <div className="flex items-center gap-2 border-b border-[rgba(26,51,0,0.15)] pb-2">
            <CheckCircle size={18} weight="fill" className="shrink-0 text-[#1a3300]" />
            <p className="font-sans text-xs font-bold text-[#1a3300]">Transmission Received</p>
          </div>
          <p className="mt-3 font-sans text-xs leading-relaxed text-[#1a3300]/85">
            Maveli is alive, but trapped. He has been broadcasting on an offline channel. The next clue tells you where he is sheltered.
          </p>
        </Panel>
        <Btn onClick={continueTracker} className="mt-6 w-full max-w-sm justify-center text-base py-3.5">
          <span>Follow the SOS</span>
          <ArrowRight size={18} />
        </Btn>
      </div>
    );
  }

  if (view.kind === "sos-dup") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#fcfaf5] px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d5f5c2]">
          <CheckCircle size={32} className="text-[#1a3300]" />
        </div>
        <h1 className="font-display mt-4 text-2xl text-[#1a3300]">
          SOS Already Received
        </h1>
        <p className="mx-auto mt-2 max-w-[34ch] font-sans text-xs text-[#666666]">
          Your squad already recovered this transmission. The next clue is ready in the tracker.
        </p>
        <Btn onClick={continueTracker} className="mt-6">
          Go to Tracker <ArrowRight size={16} />
        </Btn>
      </div>
    );
  }

  // final
  const solved =
    answers.some((a) => a.kind === "reconstruction" && a.correct) ||
    game.winnerTeamId === team.id;

  return (
    <div className="min-h-[100dvh] bg-[#fcfaf5]">
      {bar}
      <main className="mx-auto max-w-md px-5 py-8">
        {solved ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d5f5c2]">
              <Leaf size={36} weight="fill" className="text-[#1a3300]" />
            </div>
            <h1 className="font-display mt-4 text-3xl text-[#1a3300]">
              Maveli is Safe!
            </h1>
            <p className="mx-auto mt-2 max-w-[34ch] font-sans text-xs text-[#666666]">
              Your squad proved the final instruction. The hunt is complete.
            </p>
            <Btn onClick={continueTracker} className="mt-6 w-full justify-center text-base py-3.5">
              <span>Continue</span>
              <ArrowRight size={18} />
            </Btn>
          </div>
        ) : (
          <div className="space-y-5">
            <Panel tone="mint" className="p-6 text-center">
              <Detective size={32} weight="bold" className="mx-auto text-[#1a3300]" />
              <h1 className="font-display mt-2 text-2xl text-[#1a3300]">
                You Found the Sanctuary
              </h1>
              <p className="mx-auto mt-2 max-w-[36ch] font-sans text-xs leading-relaxed text-[#1a3300]/80">
                Maveli is here. The final marker demands proof. Reconstruct the instruction from your five words in exact order.
              </p>
              {view.duplicate && (
                <p className="mt-3 flex items-start justify-center gap-2 rounded-[6px] border border-[#b6b6b6] bg-white p-2 text-xs text-[#666666]">
                  <WarningCircle size={16} className="mt-0.5 shrink-0" />
                  This marker was already scanned by your squad.
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
