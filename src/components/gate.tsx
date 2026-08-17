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
  const { team, game, answers } = useGame();
  const [words, setWords] = useState<string[]>(() =>
    game.gateSlots.map(() => ""),
  );
  const [failCount, setFailCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

  const submit = () => {
    if (locked || !team) return;
    if (words.some((w) => w.trim() === "")) {
      setError("All five words are required.");
      return;
    }
    const answer = store.submitReconstruction(team.id, words);
    if (answer.correct) return;
    const next = failCount + 1;
    setFailCount(next);
    setError(
      "That order does not reconstruct the instruction. Re-read the word clues on the evidence board.",
    );
    if (next >= MAX_FAILS) {
      setLocked(true);
    }
  };

  if (solved) {
    return (
      <Panel className="p-6 text-center">
        <CheckCircle size={44} weight="fill" className="mx-auto text-leaf" />
        <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-mist">
          Mavelli is safe
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-fog">
          The instruction matched. You proved your team was there.
        </p>
      </Panel>
    );
  }

  return (
    <div>
      <SectionLabel>Final gate</SectionLabel>
      <Panel className="p-5">
        <p className="text-sm leading-relaxed text-fog">
          The five words on your evidence board are fragments of one hidden
          instruction. Reconstruct it and enter the words in the exact order
          the instruction reads.
        </p>
        <div className="mt-4 space-y-3">
          {game.gateSlots.map((slot, i) => (
            <label key={slot + i} className="block">
              <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-moss">
                {slot}
              </span>
              <input
                value={words[i]}
                onChange={(e) => setWord(i, e.target.value)}
                className="field text-center font-mono text-lg font-bold uppercase tracking-[0.3em]"
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
          <p className="mt-3 flex items-start gap-2 text-sm text-red-300">
            <WarningCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        <Btn onClick={submit} disabled={locked} className="mt-4 w-full">
          {locked ? `Locked for ${countdown}s` : "Confirm the instruction"}
        </Btn>
      </Panel>
    </div>
  );
}
