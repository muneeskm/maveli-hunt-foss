"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { Btn, Panel, SectionLabel } from "@/components/ui";
import { useGame } from "@/hooks/use-game";
import { store } from "@/lib/store";

const MAX_FAILS = 5;
const LOCK_SECONDS = 30;

/*
 * The final gate. The five words on the evidence board are fragments of a
 * hidden instruction. Teams must reconstruct the instruction in its exact
 * order - the board alone is not enough, the word clues matter.
 */
export function ReconstructionGate() {
  const { team, game, answers, gateLockSeconds } = useGame();
  const [words, setWords] = useState<string[]>(() =>
    game.gateSlots.map(() => ""),
  );
  const [failCount, setFailCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // server-side lock (real mode): the server refuses attempts for 60s after
  // 5 wrong answers, even across devices
  useEffect(() => {
    if (gateLockSeconds > 0) {
      setFailCount(MAX_FAILS);
      setLocked(true);
    }
  }, [gateLockSeconds]);

  const solved = useMemo(
    () => answers.some((a) => a.kind === "reconstruction" && a.correct),
    [answers],
  );

  useEffect(() => {
    if (!locked) return;
    setCountdown(LOCK_SECONDS);
    const t = window.setInterval(() => {
      setCountdown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [locked]);

  useEffect(() => {
    if (locked && countdown === 0) {
      setLocked(false);
      setFailCount(0);
      setError(null);
    }
  }, [locked, countdown]);

  if (!team) return null;

  const setWord = (i: number, v: string) => {
    setWords((prev) =>
      prev.map((w, j) => (j === i ? v.toUpperCase().slice(0, 16) : w)),
    );
    setError(null);
  };

  const submit = async () => {
    if (locked || busy || !team) return;
    if (words.some((w) => w.trim() === "")) {
      setError("All five words are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await store.submitReconstruction(team.id, words);
      if (res.ok && res.correct) return;
      if (res.lockSeconds && res.lockSeconds > 0) {
        setFailCount(MAX_FAILS);
        setLocked(true);
        setError(null);
        return;
      }
      const next = failCount + 1;
      setFailCount(next);
      setError(
        res.ok
          ? "That order does not reconstruct the instruction. Re-read the word clues on the evidence board."
          : res.message,
      );
      if (next >= MAX_FAILS) {
        setLocked(true);
      }
    } finally {
      setBusy(false);
    }
  };

  if (solved) {
    return (
      <Panel tone="mint" className="p-6 text-center bg-[#102117] border border-[#22c55e]/40 text-white">
        <CheckCircle size={40} weight="fill" className="mx-auto text-[#22c55e]" />
        <h2 className="font-display mt-3 text-2xl text-white">
          Maveli is Safe!
        </h2>
        <p className="mt-1 font-sans text-xs leading-relaxed text-[#9ca3af]">
          The instruction matched. Your squad proved the discovery.
        </p>
      </Panel>
    );
  }

  return (
    <div>
      <SectionLabel>Final Reconstruction Gate</SectionLabel>
      <Panel className="p-5 bg-[#111813] border border-[#202d24]">
        <p className="font-sans text-xs leading-relaxed text-[#9ca3af]">
          The five words on your evidence board are fragments of one hidden
          instruction. Reconstruct it and enter the words in the exact sequence
          the instruction reads.
        </p>
        <div className="mt-4 space-y-3">
          {game.gateSlots.map((slot, i) => (
            <label key={slot + i} className="block">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white font-bold">
                {slot}
              </span>
              <input
                value={words[i]}
                onChange={(e) => setWord(i, e.target.value)}
                className="field text-center font-mono text-lg font-bold uppercase tracking-widest"
                placeholder="?????"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                aria-label={slot}
              />
            </label>
          ))}
        </div>
        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-[6px] border border-red-800 bg-[#2d1414] p-2.5 font-sans text-xs font-semibold text-red-200">
            <WarningCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            {error}
          </p>
        )}
        <Btn onClick={submit} disabled={locked || busy} className="mt-4 w-full justify-center text-sm py-3">
          <span>{locked ? `Locked for ${countdown}s` : busy ? "Checking..." : "Confirm Final Instruction"}</span>
        </Btn>
      </Panel>
    </div>
  );
}
