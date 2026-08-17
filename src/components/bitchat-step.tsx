"use client";

import { useMemo, useState } from "react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { Btn, Panel, SectionLabel } from "@/components/ui";
import { useGame } from "@/hooks/use-game";
import { store } from "@/lib/store";

/*
 * Day 2, step 2. Mavelli communicates through BitChat. Teams read the code
 * from his BitChat message and enter it here. This is the one external
 * verification in the game - BitChat itself is a real app.
 */
export function BitchatStep() {
  const { team, settings, answers } = useGame();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const solved = useMemo(
    () => answers.some((a) => a.kind === "bitchat" && a.correct),
    [answers],
  );

  if (!team) return null;

  const submit = async () => {
    if (!code.trim()) {
      setError("Enter the code from Mavelli's message.");
      return;
    }
    const res = await store.submitBitchat(team.id, code);
    if (res.ok && res.correct) {
      setError(null);
      return;
    }
    setError(
      res.ok
        ? "That code does not match the transmission. Re-read the BitChat message."
        : res.message,
    );
  };

  if (solved) {
    return (
      <Panel tone="mint" className="p-5">
        <div className="flex items-center gap-2">
          <CheckCircle size={20} weight="fill" className="shrink-0 text-[#1a3300]" />
          <p className="font-sans font-bold text-sm text-[#1a3300]">Transmission verified.</p>
        </div>
        <p className="mt-1 font-sans text-xs leading-relaxed text-[#1a3300]/80">
          The SOS revealed where Maveli is sheltered. Follow the final clue.
        </p>
      </Panel>
    );
  }

  return (
    <div>
      <SectionLabel>BitChat Transmission</SectionLabel>
      <Panel className="p-5">
        <p className="font-sans text-xs leading-relaxed text-[#555555]">{settings.bitchatGuide}</p>
        <label className="mt-4 block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-[#1a3300]">
            Code from the message
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 24))}
            className="field text-center font-mono text-lg font-bold uppercase tracking-widest"
            placeholder="......."
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            aria-label="Code from the BitChat message"
          />
        </label>
        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-[6px] border border-red-200 bg-red-50 p-2.5 font-sans text-xs font-semibold text-red-800">
            <WarningCircle size={16} className="mt-0.5 shrink-0 text-red-700" />
            {error}
          </p>
        )}
        <Btn onClick={submit} className="mt-4 w-full justify-center text-sm py-2.5">
          Verify Code
        </Btn>
      </Panel>
    </div>
  );
}
