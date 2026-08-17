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
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <CheckCircle size={20} weight="fill" className="shrink-0 text-leaf" />
          <p className="font-semibold text-mist">Transmission verified.</p>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-fog">
          The SOS revealed where Mavelli is hiding. Follow the final clue.
        </p>
      </Panel>
    );
  }

  return (
    <div>
      <SectionLabel>BitChat transmission</SectionLabel>
      <Panel className="p-5">
        <p className="text-sm leading-relaxed text-fog">{settings.bitchatGuide}</p>
        <label className="mt-4 block">
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-fog">
            Code from the message
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 24))}
            className="field text-center font-mono text-lg font-bold uppercase tracking-[0.3em]"
            placeholder="......."
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            aria-label="Code from the BitChat message"
          />
        </label>
        {error && (
          <p className="mt-3 flex items-start gap-2 text-sm text-red-300">
            <WarningCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        <Btn onClick={submit} className="mt-4 w-full">
          Verify code
        </Btn>
      </Panel>
    </div>
  );
}
