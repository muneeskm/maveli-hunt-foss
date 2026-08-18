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
      <div className="flex items-center justify-between gap-2 rounded-[16px] border border-[#202d24] bg-[#111813]/95 px-3.5 py-2.5 backdrop-blur-md shadow-sm">
        <Link
          href="/tracker"
          className="flex items-center gap-2 font-sans text-xs font-bold text-white"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#14261a] border border-[#22c55e]/40 overflow-hidden">
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
          className="rounded-[6px] border border-[#202d24] bg-[#16221a] px-2.5 py-1 font-sans text-xs font-medium text-white hover:bg-[#1a2c20] transition-colors"
        >
          Leaderboard
        </Link>
      </div>
    </header>
  );

  if (view.kind === "checking") {
    return (
      <div className="min-h-[100dvh] bg-[#090d0b] text-white">
        {bar}
        <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#14261a] border border-[#22c55e]/40">
            <Radio size={28} className="anim-blink text-[#22c55e]" />
          </div>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-[#22c55e]">
            Decoding campus evidence...
          </p>
        </div>
      </div>
    );
  }

  if (view.kind === "out_of_order") {
    return (
      <div className="min-h-[100dvh] bg-[#090d0b] text-white">
        {bar}
        <main className="mx-auto flex min-h-[calc(100dvh-70px)] max-w-md flex-col justify-center px-5 py-8">
          <div className="text-center">
            <TaglineBadge className="mx-auto mb-3">
              <WarningCircle size={14} weight="bold" /> OUT OF SEQUENCE
            </TaglineBadge>
            <h1 className="font-display text-3xl sm:text-4xl text-white">
              Whoa there, <HighlightWord>Time Traveler!</HighlightWord> ⏳
            </h1>
          </div>

          <Panel tone="yellow" className="mt-6 p-6 text-center bg-[#14261a] border border-[#22c55e]/40">
            <p className="font-mono text-xs uppercase tracking-wider text-[#86efac]">
              Sequence Check
            </p>
            <p className="mt-3 font-sans text-sm leading-relaxed text-white">
              You just scanned <strong>{view.targetLocationName}</strong> (Node 0{view.targetOrder}),
              but your squad hasn&apos;t uncovered{" "}
              <strong>Sighting 0{view.expectedOrder}</strong> ({view.expectedLocationName}) yet!
            </p>

            <div className="mt-4 rounded-[8px] border border-[#202d24] bg-[#16201a] p-3 text-xs italic text-[#86efac]">
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
      <div className="min-h-[100dvh] bg-[#090d0b] text-white">
        {bar}
        <div className="flex min-h-[80dvh] flex-col items-center justify-center px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3f1515] border border-red-800">
            <XCircle size={32} className="text-red-400" />
          </div>
          <h1 className="font-display mt-4 text-2xl text-white">
            Not a Hunt Marker
          </h1>
          <p className="mx-auto mt-2 max-w-[32ch] font-sans text-xs text-[#9ca3af]">
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
      <div className="min-h-[100dvh] bg-[#090d0b] text-white">
        {bar}
        <main className="mx-auto flex min-h-[calc(100dvh-70px)] max-w-md flex-col justify-center px-5 py-8">
          <div className="text-center">
            <TaglineBadge className="mx-auto mb-3">
              <Sparkle weight="fill" size={13} />
              {isFirst ? "EVIDENCE RECOVERED" : "ALREADY RECOVERED"}
            </TaglineBadge>
            <h1 className="font-display text-3xl sm:text-4xl text-white">
              {view.name}
            </h1>
          </div>

          {view.photoUrl && (
            <div className="relative mt-5 aspect-video w-full overflow-hidden rounded-[14px] border border-[#202d24] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={view.photoUrl}
                alt={view.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <Panel tone="yellow" className="mt-5 p-6 text-center bg-[#14261a] border border-[#22c55e]/40">
            <p className="font-mono text-xs uppercase tracking-widest text-[#86efac]">
              Decrypted Word 0{view.order}
            </p>
            {revealed ? (
              <div className="anim-mask mt-3">
                <p className="font-mono text-4xl font-extrabold tracking-widest text-[#22c55e]">
                  {view.word || "RECORDED"}
                </p>
                {view.wordClue && (
                  <p className="mx-auto mt-3 max-w-[36ch] font-sans text-xs leading-relaxed text-[#9ca3af]">
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
                  className="mt-4 bg-[#16221a] border border-[#22c55e]/40 text-[#22c55e]"
                >
                  <Eye size={16} /> Reveal Word
                </Btn>
              </>
            )}
          </Panel>

          {/* Instagram Spotlight Card if Cake Farm Cafe (order 2) */}
          {view.order === 2 && (
            <div className="mt-5 rounded-[14px] border-2 border-[#22c55e] bg-[#102419] p-5 text-left shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-[#090d0b]">
                  <InstagramLogo size={24} weight="fill" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans text-base font-bold text-white">
                      Maveli&apos;s Instagram Transmission
                    </h3>
                    <span className="rounded-[4px] bg-[#22c55e] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#090d0b]">
                      CRITICAL
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#9ca3af]">
                    Maveli is transmitting updates via his Instagram profile (<strong>@maveli.thamburan_</strong>). Track his latest posts and stories to uncover his next destination and timestamp clues.
                  </p>
                  <a
                    href="https://www.instagram.com/maveli.thamburan_?igsh=MWo1ZW5mc3h3bTllOA==&igsi=MWo1ZW5mc3h3bTllOA=="
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary mt-3 flex w-full items-center justify-center gap-2 text-xs font-bold py-2.5"
                  >
                    <InstagramLogo size={16} weight="fill" />
                    <span>Open @maveli.thamburan_ on Instagram ↗</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          <p className="mt-4 text-center font-sans text-xs text-[#9ca3af]">
            {isFirst
              ? "✓ Checkpoint automatically logged to your squad's Evidence Board & Leaderboard!"
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
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#090d0b] px-6 text-center text-white">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#14261a] border border-[#22c55e]/40">
          <Radio size={36} className="anim-blink text-[#22c55e]" />
        </div>
        <h1 className="font-display mt-6 text-3xl text-white">
          Signal Locking...
        </h1>
        <p className="mx-auto mt-2 max-w-[34ch] font-sans text-xs text-[#9ca3af]">
          Stay in the vicinity. The transmission packet is resolving...
        </p>
      </div>
    );
  }

  if (view.kind === "sos-alarm") {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#090d0b] px-6 py-10 text-center text-white">
        <TaglineBadge className="mx-auto mb-3">
          EMERGENCY ALERT
        </TaglineBadge>
        <h1 className="font-display mt-2 text-3xl sm:text-4xl text-white">
          Maveli SOS Detected!
        </h1>
        <Panel tone="mint" className="mt-6 w-full max-w-sm p-5 text-left bg-[#102117] border border-[#22c55e]/40">
          <div className="flex items-center gap-2 border-b border-[#202d24] pb-2">
            <CheckCircle size={18} weight="fill" className="shrink-0 text-[#22c55e]" />
            <p className="font-sans text-xs font-bold text-white">Transmission Received</p>
          </div>
          <p className="mt-3 font-sans text-xs leading-relaxed text-[#9ca3af]">
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
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#090d0b] px-6 text-center text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#14261a] border border-[#22c55e]/40">
          <CheckCircle size={32} className="text-[#22c55e]" />
        </div>
        <h1 className="font-display mt-4 text-2xl text-white">
          SOS Already Received
        </h1>
        <p className="mx-auto mt-2 max-w-[34ch] font-sans text-xs text-[#9ca3af]">
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
    <div className="min-h-[100dvh] bg-[#090d0b] text-white">
      {bar}
      <main className="mx-auto max-w-md px-5 py-8">
        {solved ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#14261a] border border-[#22c55e]/40">
              <Leaf size={36} weight="fill" className="text-[#22c55e]" />
            </div>
            <h1 className="font-display mt-4 text-3xl text-white">
              Maveli is Safe!
            </h1>
            <p className="mx-auto mt-2 max-w-[34ch] font-sans text-xs text-[#9ca3af]">
              Your squad proved the final instruction. The hunt is complete.
            </p>
            <Btn onClick={continueTracker} className="mt-6 w-full justify-center text-base py-3.5">
              <span>Continue</span>
              <ArrowRight size={18} />
            </Btn>
          </div>
        ) : (
          <div className="space-y-5">
            <Panel tone="mint" className="p-6 text-center bg-[#102117] border border-[#22c55e]/40">
              <Detective size={32} weight="bold" className="mx-auto text-[#22c55e]" />
              <h1 className="font-display mt-2 text-2xl text-white">
                You Found the Sanctuary
              </h1>
              <p className="mx-auto mt-2 max-w-[36ch] font-sans text-xs leading-relaxed text-[#9ca3af]">
                Maveli is here. The final marker demands proof. Reconstruct the instruction from your five words in exact order.
              </p>
              {view.duplicate && (
                <p className="mt-3 flex items-start justify-center gap-2 rounded-[6px] border border-[#202d24] bg-[#16201a] p-2 text-xs text-[#9ca3af]">
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
  );
}
