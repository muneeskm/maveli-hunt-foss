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
  Sparkle,
  Trophy,
  Users,
  Warning,
  WarningCircle,
  WhatsappLogo,
} from "@phosphor-icons/react";
import {
  Btn,
  Chip,
  HighlightWord,
  Panel,
  SectionLabel,
  TaglineBadge,
} from "@/components/ui";
import { EvidenceBoard } from "@/components/evidence-board";
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
    <Panel tone="mint" className="mb-5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users size={16} className="shrink-0 text-[#1a3300]" />
            <span className="truncate font-sans font-bold text-[#1a3300]">{team.name}</span>
          </div>
          <p className="mt-0.5 font-sans text-xs text-[#1a3300]/80">
            {team.member1} / {team.member2}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-[6px] bg-[#ffe95c] px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-[#1a3300]">
            {team.code}
          </span>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy access code"
            className="flex h-[32px] w-[40px] items-center justify-center rounded-[8px] border border-[rgba(26,51,0,0.2)] bg-white text-[#1a3300] hover:bg-[#fcfaf5]"
          >
            {copied ? <Check size={20} className="text-[#1a3300]" weight="bold" /> : <Copy size={20} />}
          </button>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- standby (before Day 1) ---------- */

export function StandbyStage() {
  return (
    <div className="space-y-5">
      <Panel className="p-6 text-center">
        <TaglineBadge className="mx-auto">
          <Sparkle weight="fill" size={13} /> STANDBY MODE
        </TaglineBadge>
        <h1 className="font-display mt-4 text-2xl sm:text-3xl text-[#1a3300]">
          Squad Registered & <HighlightWord>Locked In</HighlightWord>
        </h1>
        <p className="mx-auto mt-2 max-w-[42ch] font-sans text-sm leading-relaxed text-[#555555]">
          The campus investigation grid is currently locked. Checkpoints and clue signals will activate once the hunt officially commences. Keep your squad access code ready.
        </p>
      </Panel>

      {/* Mandatory WhatsApp Group Callout */}
      <div className="rounded-[14px] border-2 border-[#1a3300] bg-[#d5f5c2] p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a3300] text-[#fcfaf5]">
            <WhatsappLogo size={24} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-base font-bold text-[#1a3300]">
                Official Hunt WhatsApp Group
              </h3>
              <span className="rounded-[4px] bg-[#1a3300] px-2 py-0.5 font-mono text-[9px] font-bold text-[#fcfaf5]">
                REQUIRED
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#1a3300]/85">
              <strong>Every member must join.</strong> Kickoff announcements, live broadcasts, and game hints will be posted in this group.
            </p>
            <a
              href="https://chat.whatsapp.com/FFQ517Asdpv13omB9ArMwv"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary mt-3 flex w-full items-center justify-center gap-2 text-sm font-semibold py-2.5"
            >
              <WhatsappLogo size={18} weight="fill" />
              <span>Join WhatsApp Group ↗</span>
            </a>
          </div>
        </div>
      </div>

      <Panel tone="paper" className="p-4">
        <div className="flex items-start gap-2.5">
          <Warning size={18} className="mt-0.5 shrink-0 text-[#1a3300]" weight="fill" />
          <div className="text-xs leading-relaxed text-[#1a3300]/80">
            <p className="font-semibold text-[#1a3300]">Hunt Readiness Checklist:</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              <li>Both squad members must note down the squad access code from the badge above.</li>
              <li>Make sure both members have joined the WhatsApp group.</li>
              <li>Keep your phone charged for scanning QR codes on campus.</li>
            </ul>
          </div>
        </div>
      </Panel>
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
        <p className="text-[15px] leading-relaxed text-[#1a3300]">{location.clueText}</p>
      </Panel>

      <Panel tone="mint" className="p-4">
        <div className="flex items-center gap-2">
          <MapPin size={16} weight="fill" className="shrink-0 text-[#1a3300]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#1a3300]">
            Mapillary View
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#1a3300]/80">
          {location.mapillaryNote ??
            "Open the Mapillary capture of this landmark. Compare it with the site photo to spot the difference."}
        </p>
        {location.mapillaryUrl && (
          <a
            href={location.mapillaryUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline mt-3 w-full text-xs"
          >
            <MapPin size={16} /> Open Mapillary Capture
          </a>
        )}
      </Panel>

      {location.photoUrl && (
        <div className="overflow-hidden rounded-[14px] border border-[#b6b6b6] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={location.photoUrl}
            alt={location.name}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      )}

      {solved ? (
        <Panel tone="yellow" className="p-5 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[#1a3300]">
            Evidence Recovered
          </p>
          <p className="mt-2 font-mono text-3xl font-extrabold tracking-widest text-[#1a3300]">
            {word?.word ?? "?????"}
          </p>
          {word?.wordClue && (
            <p className="mx-auto mt-2 max-w-[36ch] font-sans text-xs leading-relaxed text-[#1a3300]/80">
              {word.wordClue}
            </p>
          )}
        </Panel>
      ) : (
        <Panel className="p-5">
          <p className="font-sans font-bold text-sm text-[#1a3300]">Type the word that differs</p>
          <p className="mt-1 font-sans text-xs leading-relaxed text-[#666666]">
            Enter the exact changed word found in this sighting.
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
              className="field text-center font-mono text-lg font-bold uppercase tracking-widest"
              placeholder="THE WORD"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-label="The word that differs"
            />
            {error && (
              <p className="flex items-start gap-2 text-xs font-medium text-red-700">
                <WarningCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
            <Btn onClick={submit} disabled={busy} className="w-full justify-center">
              <span>{busy ? "Verifying..." : "Verify Word"}</span>
              <ArrowRight size={16} />
            </Btn>
          </div>
        </Panel>
      )}

      {hasHint && (
        <Panel tone="teal" className="p-4">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#1a3300]">
            <ShieldWarning size={15} /> Level 1 Hint
          </div>
          <p className="mt-1.5 font-sans text-xs leading-relaxed text-[#1a3300]/85">{location.hintText}</p>
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
      <div className="pt-2 text-center">
        <TaglineBadge className="mx-auto mb-2">
          DAY 1 · END OF TRAIL
        </TaglineBadge>
        <h1 className="font-display mt-2 text-3xl font-extrabold text-[#1a3300]">
          Maveli Has Disappeared
        </h1>
        <p className="mx-auto mt-2 max-w-[34ch] font-sans text-sm leading-relaxed text-[#555555]">
          The trail stops here. The last clue did not lead to Maveli. Something is amiss.
        </p>
      </div>

      <Panel tone="mint" className="p-5">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#1a3300]">
          <Radio size={15} className="anim-blink" /> Signal Lost
        </div>
        <p className="mt-2 font-sans text-xs leading-relaxed text-[#1a3300]">
          {isNight
            ? "Maveli broke radio silence. He is trapped somewhere on campus and has found a way to communicate without the internet. He needs your squad tomorrow."
            : "The trail was deliberate. Maveli was leading us somewhere on purpose. Stay ready."}
        </p>
      </Panel>

      {isNight ? (
        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <InstagramLogo size={18} className="shrink-0 text-[#1a3300]" />
            <p className="font-sans font-bold text-sm text-[#1a3300]">Emergency Instagram Broadcast</p>
          </div>
          <p className="mt-1 font-sans text-xs leading-relaxed text-[#666666]">
            Maveli went live and transmitted an SOS. Watch the broadcast so your squad is prepared for Day 2.
          </p>
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary mt-4 w-full text-xs"
          >
            <InstagramLogo size={16} /> Open Instagram Broadcast
          </a>
        </Panel>
      ) : (
        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <Radio size={18} className="shrink-0 text-[#1a3300]" />
            <p className="font-sans font-bold text-sm text-[#1a3300]">Offline Broadcast Channel</p>
          </div>
          <p className="mt-1 font-sans text-xs leading-relaxed text-[#666666]">
            Maveli has found a way to communicate without cellular internet.
          </p>
          <button
            type="button"
            onClick={() => setBitchatOpen((v) => !v)}
            className="mt-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#1a3300] underline"
          >
            BITCHAT PROTOCOL — HOW IT WORKS
          </button>
          {bitchatOpen && (
            <p className="mt-2 border-t border-[#b6b6b6]/40 pt-3 font-sans text-xs leading-relaxed text-[#555555]">
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
      <SectionLabel>Day 2 — Rescue</SectionLabel>
      <Panel tone="yellow" className="p-5">
        <div className="flex items-center gap-2">
          <Radio size={16} className="anim-blink text-[#1a3300]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#1a3300]">
            Emergency Transmission
          </span>
        </div>
        <h2 className="font-display mt-2 text-2xl text-[#1a3300]">
          Find the Signal
        </h2>
        <p className="mt-2 font-sans text-xs leading-relaxed text-[#1a3300]/80">
          Maveli&apos;s SOS is broadcasting on campus. Reach the area and locate the Emergency Transmission marker.
        </p>
      </Panel>
      {sos && (
        <Panel className="p-4">
          <p className="font-sans text-sm leading-relaxed text-[#1a3300]">{sos.clueText}</p>
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
      <SectionLabel>Final Hunt</SectionLabel>
      <Panel tone="mint" className="p-5">
        <div className="flex items-center gap-2">
          <Leaf size={18} className="anim-blink text-[#1a3300]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#1a3300]">
            He is Close
          </span>
        </div>
        <h2 className="font-display mt-2 text-2xl text-[#1a3300]">
          Find the Sanctuary
        </h2>
        <p className="mt-2 font-sans text-xs leading-relaxed text-[#1a3300]/80">
          The transmission indicated where Maveli is sheltered. Reach the location and scan the final marker.
        </p>
      </Panel>
      {fin && (
        <Panel className="p-4">
          <p className="font-sans text-sm leading-relaxed text-[#1a3300]">{fin.clueText}</p>
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
      <Panel className="p-5">
        <p className="font-sans text-sm leading-relaxed text-[#1a3300]">
          You are standing where Maveli is sheltered. The final marker demands proof: the five words, reconstructed in the exact order he left.
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
      <div className="pt-4 text-center">
        <TaglineBadge className="mx-auto mb-3">
          MISSION ACCOMPLISHED
        </TaglineBadge>
        <Leaf size={44} weight="fill" className="mx-auto text-[#1a3300]" />
        <h1 className="font-display mt-3 text-3xl font-extrabold text-[#1a3300]">
          Maveli is Safe!
        </h1>
        <p className="mx-auto mt-2 max-w-[34ch] font-sans text-sm leading-relaxed text-[#555555]">
          {myWin
            ? "Your squad found him first! Maveli is safe thanks to your deduction."
            : "Your squad solved the trail. The hunt is complete."}
        </p>
        <Link
          href="/leaderboard"
          className="btn btn-primary mx-auto mt-6 w-full max-w-xs"
        >
          <Trophy size={18} /> View Leaderboard
        </Link>
        <Link
          href="/tracker"
          className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-1 text-xs font-medium text-[#666666] hover:text-[#1a3300]"
        >
          Back to Tracker <ArrowRight size={14} />
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
      <h1 className="font-display text-3xl font-extrabold text-[#1a3300]">
        The Hunt is Over
      </h1>
      {winner ? (
        <Panel tone="mint" className="p-6">
          <Trophy size={32} weight="fill" className="mx-auto text-[#1a3300]" />
          <p className="mt-2 font-sans text-lg font-bold text-[#1a3300]">{winner.name}</p>
          <p className="font-sans text-xs text-[#1a3300]/80">found Maveli first.</p>
        </Panel>
      ) : (
        <p className="mx-auto max-w-[34ch] font-sans text-sm leading-relaxed text-[#555555]">
          Results will be announced shortly. Thank you for the search.
        </p>
      )}
      <div className="pt-2">
        <EvidenceBoard compact />
      </div>
    </div>
  );
}
