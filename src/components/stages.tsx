"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  InstagramLogo,
  Leaf,
  MapPin,
  Radio,
  ShieldWarning,
  Trophy,
  Users,
  WarningCircle,
} from "@phosphor-icons/react";
import { Btn, Panel, SectionLabel } from "@/components/ui";
import { EvidenceBoard } from "@/components/evidence-board";
import { NodeTreeTimeline } from "@/components/node-tree-timeline";
import { BitchatStep } from "@/components/bitchat-step";
import { ReconstructionGate } from "@/components/gate";
import { QRScannerButton } from "@/components/qr-scanner";
import { useGame } from "@/hooks/use-game";
import { store } from "@/lib/store";
import type { GameLocation } from "@/lib/types";

/* ---------- team badge ---------- */

export function TeamBadge() {
  const { team } = useGame();
  const [copied, setCopied] = useState(false);
  if (!team) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(team.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <Panel className="mb-5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users size={16} className="shrink-0 text-leaf" />
            <span className="truncate font-semibold text-mist">{team.name}</span>
          </div>
          <p className="mt-0.5 text-xs text-fog">
            {team.member1} / {team.member2}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="font-mono text-sm font-bold tracking-[0.2em] text-leaf">
            {team.code}
          </span>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy access code"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-fog hover:text-mist"
          >
            {copied ? <Check size={16} className="text-leaf" /> : <Copy size={16} />}
          </button>
        </div>
      </div>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-moss">
        Share this code so every member can sign in
      </p>
    </Panel>
  );
}

/* ---------- standby (before Day 1) ---------- */

export function StandbyStage() {
  return (
    <div className="space-y-5">
      <Panel className="border-leaf/40 p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/maveli-logo.png"
          alt="The Maveli Files"
          className="mx-auto h-16 w-16 rounded-full border border-line-2 object-cover shadow-lg shadow-leaf/20"
        />
        <h1 className="mt-3 text-xl font-black uppercase tracking-tight text-mist">
          Squad Registered · Stand By
        </h1>
        <p className="mx-auto mt-2 max-w-[36ch] text-sm leading-relaxed text-fog">
          Maveli was last spotted near Cake Farm. The investigation tracker will activate when the hunt commences. Keep your access code safe.
        </p>
      </Panel>
      <NodeTreeTimeline
        title="Investigation Trail (7 Nodes)"
        subtitle="First Sighting: Cake Farm"
      />
    </div>
  );
}

/* ---------- Day 1 sighting (Mapillary diff-word) ---------- */

export function SightingStage({ location }: { location: GameLocation }) {
  const { team, hints, scans, words } = useGame();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const solved = team
    ? scans.some((s) => s.teamId === team.id && s.locationId === location.id)
    : false;
  const hasHint = hints.some((h) => h.locationId === location.id);
  const word = words[location.id];

  const submit = async () => {
    if (!team || busy) return;
    if (!value.trim()) {
      setError("Type the one word that differs.");
      return;
    }
    setBusy(true);
    try {
      const res = await store.submitSpotDiff(team.id, location.id, value);
      if (res.ok && res.correct) {
        setError(null);
        setValue("");
        return;
      }
      setError(
        res.ok
          ? "That word does not match. Compare the two images again."
          : res.message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionLabel>{location.name}</SectionLabel>

      <Panel className="p-4">
        <p className="text-[15px] leading-relaxed text-mist">{location.clueText}</p>
      </Panel>

      <Panel className="p-4">
        <div className="flex items-center gap-2">
          <MapPin size={16} weight="fill" className="shrink-0 text-leaf" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-leaf">
            Mapillary view
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-fog">
          {location.mapillaryNote ??
            "Open the Mapillary view of this spot. It is the original - one word was changed in our copy."}
        </p>
        <a
          href={location.mapillaryUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost mt-4 w-full"
        >
          <MapPin size={18} /> Open Mapillary view
        </a>
      </Panel>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fog">
            This site&apos;s copy
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-moss">
            One word differs
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={location.photoUrl}
            alt={`${location.name} - site copy`}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      </div>

      {solved ? (
        <Panel className="border-leaf/40 p-5 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-leaf">
            Evidence recovered
          </p>
          <p className="mt-2 font-mono text-3xl font-black tracking-[0.24em] text-leaf">
            {word?.word ?? "?????"}
          </p>
          <p className="mx-auto mt-2 max-w-[36ch] text-sm leading-relaxed text-fog">
            {word?.wordClue}
          </p>
        </Panel>
      ) : (
        <Panel className="p-4">
          <p className="font-semibold text-mist">Type the word that differs</p>
          <p className="mt-1 text-sm leading-relaxed text-fog">
            Compare the Mapillary view with this site&apos;s copy. Enter the one
            word that was changed.
          </p>
          <div className="mt-3 space-y-3">
            <input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              className="field text-center font-mono text-lg font-bold uppercase tracking-[0.24em]"
              placeholder="THE WORD"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-label="The word that differs"
            />
            {error && (
              <p className="flex items-start gap-2 text-sm text-red-300">
                <WarningCircle size={18} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
            <Btn onClick={submit} disabled={busy} className="w-full">
              {busy ? "Checking..." : "Verify word"}
            </Btn>
          </div>
        </Panel>
      )}

      {hasHint && (
        <Panel className="border-leaf/40 p-4">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-leaf">
            <ShieldWarning size={14} /> Level 1 hint
          </div>
          <p className="mt-2 text-sm leading-relaxed text-fog">{location.hintText}</p>
        </Panel>
      )}

      <EvidenceBoard />
    </div>
  );
}

/* ---------- Day 1 dead end / night bridge ---------- */

export function DeadEndStage() {
  const { game, settings } = useGame();
  const [bitchatOpen, setBitchatOpen] = useState(false);
  const isNight = game.phase === "night";

  return (
    <div className="space-y-5">
      <div className="hazard h-2 w-full rounded-full" />
      <div className="pt-2 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-fog">
          Day 1 - end of trail
        </p>
        <h1 className="anim-flicker mt-2 text-3xl font-black uppercase tracking-tight text-mist">
          Mavelli has disappeared
        </h1>
        <p className="mx-auto mt-3 max-w-[34ch] text-sm leading-relaxed text-fog">
          The trail stops here. The last clue did not lead to Mavelli.
          Something is wrong.
        </p>
      </div>

      <Panel className="p-4">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-leaf">
          <Radio size={14} className="anim-blink" /> Signal lost
        </div>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          {isNight
            ? "Mavelli broke radio silence. He is trapped somewhere on campus and has found a way to communicate without the internet. He needs you tomorrow."
            : "The trail was too clean, too deliberate. Mavelli was leading us somewhere on purpose. Stay ready."}
        </p>
      </Panel>

      {isNight ? (
        <Panel className="border-leaf/40 p-4">
          <div className="flex items-center gap-2">
            <InstagramLogo size={18} className="shrink-0 text-leaf" />
            <p className="font-semibold text-mist">He is calling for help on Instagram</p>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-fog">
            Mavelli went live and sent an SOS. Watch the broadcast so your team
            is ready for Day 2.
          </p>
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost mt-4 w-full"
          >
            <InstagramLogo size={18} /> Open Instagram
          </a>
        </Panel>
      ) : (
        <Panel className="p-4">
          <div className="flex items-center gap-2">
            <Radio size={18} className="shrink-0 text-leaf" />
            <p className="font-semibold text-mist">He found another way to speak</p>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-fog">
            Mavelli has found a way to communicate without the internet. You
            will need it tomorrow.
          </p>
          <button
            type="button"
            onClick={() => setBitchatOpen((v) => !v)}
            className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-leaf"
          >
            BITCHAT - WHAT IS IT?
          </button>
          {bitchatOpen && (
            <p className="mt-2 border-t border-line pt-3 text-sm leading-relaxed text-fog">
              {settings.bitchatGuide}
            </p>
          )}
        </Panel>
      )}

      <EvidenceBoard />
    </div>
  );
}

/* ---------- Day 2 - SOS search ---------- */

export function SosStage() {
  const { locations } = useGame();
  const sos = locations.find((l) => l.id === "sos");

  return (
    <div className="space-y-5">
      <SectionLabel>Day 2 - Rescue</SectionLabel>
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Radio size={16} className="anim-blink text-leaf" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-leaf">
            Emergency transmission
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-mist">
          Find the signal
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fog">
          Mavelli's SOS is broadcasting from the search area. Reach the block
          and look for the{" "}
          <span className="font-semibold text-mist">
            MAVELLI EMERGENCY TRANSMISSION
          </span>{" "}
          poster.
        </p>
      </Panel>
      {sos && (
        <Panel className="p-4">
          <p className="text-[15px] leading-relaxed text-mist">{sos.clueText}</p>
          <div className="mt-4">
            <QRScannerButton label="Scan the transmission QR" />
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ---------- Day 2 - BitChat ---------- */

export function BitchatStage() {
  return (
    <div className="space-y-5">
      <BitchatStep />
      <EvidenceBoard />
    </div>
  );
}

/* ---------- Day 2 - final hunt ---------- */

export function FinalStage() {
  const { locations } = useGame();
  const fin = locations.find((l) => l.id === "fin");

  return (
    <div className="space-y-5">
      <SectionLabel>Final hunt</SectionLabel>
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Leaf size={18} className="anim-blink text-leaf" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-leaf">
            He is close
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-mist">
          Find the hiding place
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fog">
          The BitChat transmission told you where Mavelli is hiding. Reach the
          spot and find the final marker to prove your team was there.
        </p>
      </Panel>
      {fin && (
        <Panel className="p-4">
          <p className="text-[15px] leading-relaxed text-mist">{fin.clueText}</p>
          <div className="mt-4">
            <QRScannerButton label="Scan the final QR" />
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ---------- Day 2 - gate ---------- */

export function GateStage() {
  return (
    <div className="space-y-5">
      <Panel className="border-leaf/40 p-5">
        <p className="text-[15px] leading-relaxed text-mist">
          You are standing where Mavelli is hiding. The final marker demands
          proof: the five words, reconstructed into the instruction he left.
        </p>
      </Panel>
      <ReconstructionGate />
      <EvidenceBoard />
    </div>
  );
}

/* ---------- rescued ---------- */

export function RescuedStage() {
  const { team, game } = useGame();
  const myWin = team ? game.winnerTeamId === team.id : false;

  return (
    <div className="space-y-5">
      <div className="hazard h-2 w-full rounded-full" />
      <div className="pt-4 text-center">
        <Leaf size={48} weight="fill" className="mx-auto text-leaf" />
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-mist">
          Mavelli is safe
        </h1>
        <p className="mx-auto mt-3 max-w-[34ch] text-sm leading-relaxed text-fog">
          {myWin
            ? "Your team found him first. Mavelli is safe because of you."
            : "Your team found him. The hunt is complete."}
        </p>
        <Link
          href="/leaderboard"
          className="btn btn-primary mx-auto mt-6 w-full max-w-xs"
        >
          <Trophy size={20} /> View leaderboard
        </Link>
        <Link
          href="/tracker"
          className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-1 text-sm text-fog hover:text-mist"
        >
          Back to tracker <ArrowRight size={16} />
        </Link>
      </div>
      <EvidenceBoard compact />
    </div>
  );
}

/* ---------- ended ---------- */

export function EndedStage() {
  const { game, teams } = useGame();
  const winner = game.winnerTeamId
    ? teams.find((t) => t.id === game.winnerTeamId)
    : null;

  return (
    <div className="space-y-5 pt-4 text-center">
      <h1 className="text-3xl font-black uppercase tracking-tight text-mist">
        The hunt is over
      </h1>
      {winner ? (
        <Panel className="p-6">
          <Trophy size={32} weight="fill" className="mx-auto text-leaf" />
          <p className="mt-2 text-lg font-bold text-mist">{winner.name}</p>
          <p className="text-sm text-fog">found Mavelli first.</p>
        </Panel>
      ) : (
        <p className="mx-auto max-w-[34ch] text-sm leading-relaxed text-fog">
          Results will be announced shortly. Thank you for the search.
        </p>
      )}
      <div className="pt-2">
        <EvidenceBoard compact />
      </div>
    </div>
  );
}

