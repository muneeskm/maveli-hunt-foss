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
  const [busy, setBusy] = useState(false);

  const solved = useMemo(
    () => answers.some((a) => a.kind === "bitchat" && a.correct),
    [answers],
  );

  if (!team) return null;

  const submit = async () => {
    if (busy) return;
    if (!code.trim()) {
      setError("Enter the code from Mavelli's message.");
      return;
    }
    setBusy(true);
    try {
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
    } finally {
      setBusy(false);
    }
  };

  if (solved) {
    return (
      <Panel className="p-5 text-white">
        <div className="flex items-center gap-2">
          <CheckCircle size={20} weight="fill" className="shrink-0 text-[#22c55e]" />
          <p className="font-sans font-bold text-sm text-white">Transmission verified.</p>
        </div>
        <p className="mt-1 font-sans text-xs leading-relaxed text-[#cbd5e1]">
          The SOS revealed where Maveli is sheltered. Follow the final clue.
        </p>
      </Panel>
    );
  }

  return (
    <div>
      <SectionLabel>BitChat Transmission</SectionLabel>
      <Panel className="p-5">
        <p className="font-sans text-xs leading-relaxed text-[#cbd5e1]">{settings.bitchatGuide}</p>
        <label className="mt-4 block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white font-bold">
            Code from the message
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 24))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            className="liquid-glass-input text-center font-mono text-lg font-bold uppercase tracking-widest"
            placeholder="......."
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            aria-label="Code from the BitChat message"
          />
        </label>
        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-[10px] border border-red-500/40 bg-red-950/40 backdrop-blur-md p-2.5 font-sans text-xs font-semibold text-red-200">
            <WarningCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            {error}
          </p>
        )}
        <Btn onClick={submit} disabled={busy} className="mt-4 w-full justify-center text-sm py-2.5 shadow-lg">
          {busy ? "Verifying..." : "Verify Code"}
        </Btn>
      </Panel>
    </div>
  );
}
