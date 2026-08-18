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
    <Panel tone="mint" className="mb-5 p-4 bg-[#102117] border border-[#22c55e]/30 text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users size={16} className="shrink-0 text-[#22c55e]" />
            <span className="truncate font-sans font-bold text-white">{team.name}</span>
          </div>
          <p className="mt-0.5 font-sans text-xs text-[#9ca3af]">
            {team.member1} / {team.member2}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-[6px] bg-[#14261a] border border-[#22c55e]/40 px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-[#22c55e]">
            {team.code}
          </span>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy access code"
            className="flex h-[32px] w-[40px] items-center justify-center rounded-[8px] border border-[#22c55e]/30 bg-[#16221a] text-[#22c55e] hover:bg-[#22c55e] hover:text-[#090d0b] transition-colors"
          >
            {copied ? <Check size={20} className="text-[#22c55e]" weight="bold" /> : <Copy size={20} />}
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
      <Panel className="p-6 text-center bg-[#111813] border border-[#202d24]">
        <TaglineBadge className="mx-auto">
          <Sparkle weight="fill" size={13} /> STANDBY MODE
        </TaglineBadge>
        <h1 className="font-display mt-4 text-2xl sm:text-3xl text-white">
          Squad Registered & <HighlightWord>Locked In</HighlightWord>
        </h1>
        <p className="mx-auto mt-2 max-w-[42ch] font-sans text-sm leading-relaxed text-[#9ca3af]">
          The campus investigation grid is currently locked. Checkpoints and clue signals will activate once the hunt officially commences. Keep your squad access code ready.
        </p>
      </Panel>

      {/* Mandatory WhatsApp Group Callout */}
      <div className="rounded-[14px] border-2 border-[#22c55e] bg-[#112419] p-5 shadow-sm text-white">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-[#090d0b]">
            <WhatsappLogo size={24} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-base font-bold text-white">
                Official Hunt WhatsApp Group
              </h3>
              <span className="rounded-[4px] bg-[#22c55e] px-2 py-0.5 font-mono text-[9px] font-bold text-[#090d0b]">
                REQUIRED
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#9ca3af]">
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

      <Panel tone="paper" className="p-4 bg-[#111813] border border-[#202d24]">
        <div className="flex items-start gap-2.5">
          <Warning size={18} className="mt-0.5 shrink-0 text-[#22c55e]" weight="fill" />
          <div className="text-xs leading-relaxed text-[#9ca3af]">
            <p className="font-semibold text-white">Hunt Readiness Checklist:</p>
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
  const { team, hints, scans, words, settings } = useGame();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const solved = team
    ? scans.some((s) => s.teamId === team.id && s.locationId === location.id)
    : false;
  const hasHint = hints.some((h) => h.locationId === location.id);
  const word = words[location.id];
  const isArrival = location.order === 1;
  const isChristCafe = location.order === 3 || location.id === "s3";

  const submit = async () => {
    if (!team || busy) return;
    if (!value.trim()) {
      setError(isChristCafe ? "Enter the timestamp from Maveli's Instagram post." : "Type the one word that differs.");
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
          ? isChristCafe
            ? "That timestamp does not match Maveli's transmission. Check his latest Instagram post again."
            : "That word does not match. Compare the two images again."
          : res.message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sighting 1: The Arrival Narrative Quote */}
      {isArrival && (
        <Panel className="p-5 bg-[#111813] border border-[#202d24]">
          <TaglineBadge className="mx-auto mb-2">
            <Sparkle weight="fill" size={13} /> SIGHTING 01
          </TaglineBadge>
          <h1 className="font-display mt-2 text-center text-2xl sm:text-3xl text-white tracking-wide">
            THE ARRIVAL
          </h1>
          <blockquote className="mx-auto mt-4 max-w-[44ch] border-l-2 border-[#22c55e] pl-4 py-1 font-serif italic text-sm sm:text-base leading-relaxed text-[#d1d5db]">
            “I remember entering the kingdom.<br />
            There was something ahead of me that caught my attention.<br />
            I don&apos;t remember why...<br />
            But I remember seeing it.”
          </blockquote>
        </Panel>
      )}

      {/* Sighting 3: Christ Cafe Disconnection Narrative */}
      {isChristCafe && (
        <Panel className="p-5 text-center bg-[#111813] border border-[#202d24]">
          <TaglineBadge className="mx-auto mb-2">
            <Radio weight="fill" size={13} /> DISCONNECTION POINT
          </TaglineBadge>
          <h1 className="font-display mt-2 text-2xl sm:text-3xl text-white tracking-wide">
            Christ Cafe Signal Loss
          </h1>
          <p className="mx-auto mt-2 max-w-[46ch] font-sans text-xs sm:text-sm leading-relaxed text-[#9ca3af]">
            Maveli lost his connection in this area. Inspect his Instagram posts (<strong>@maveli.thamburan_</strong>) to discover the exact timestamp of his last transmission.
          </p>
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary mx-auto mt-4 flex w-full max-w-sm items-center justify-center gap-2 text-xs font-bold py-2.5"
          >
            <InstagramLogo size={16} weight="fill" />
            <span>Check @maveli.thamburan_ on Instagram ↗</span>
          </a>
        </Panel>
      )}

      {!isArrival && !isChristCafe && (
        <SectionLabel>{location.name}</SectionLabel>
      )}

      <Panel className="p-4 bg-[#111813] border border-[#202d24]">
        <p className="text-[15px] leading-relaxed text-white">{location.clueText}</p>
      </Panel>

      {/* Mapillary Street View Box (for Sighting 1 / sightings with Mapillary links) */}
      {location.mapillaryUrl && (
        <Panel tone="mint" className="p-4 bg-[#102117] border border-[#22c55e]/30">
          <div className="flex items-center gap-2">
            <MapPin size={16} weight="fill" className="shrink-0 text-[#22c55e]" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#86efac]">
              Mapillary Street View Comparison
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#9ca3af]">
            <strong>What is Mapillary?</strong> Mapillary is a collaborative street-level imagery platform. Explore the 360° capture of the entrance and compare it with the campus photo below to find the altered sponsor poster.
          </p>
          <a
            href={location.mapillaryUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline mt-3 flex w-full items-center justify-center gap-2 text-xs font-semibold py-2.5"
          >
            <MapPin size={16} /> Open 360° Mapillary Capture ↗
          </a>
        </Panel>
      )}

      {location.photoUrl && (
        <div className="overflow-hidden rounded-[14px] border border-[#202d24] bg-[#111813]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={location.photoUrl}
            alt={location.name}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      )}

      {solved ? (
        <Panel tone="yellow" className="p-5 text-center bg-[#14261a] border border-[#22c55e]">
          <p className="font-mono text-xs uppercase tracking-widest text-[#86efac]">
            Evidence Recovered
          </p>
          <p className="mt-2 font-mono text-3xl font-extrabold tracking-widest text-[#22c55e]">
            {word?.word ?? (isChristCafe ? "15:12" : "CONFIRMED")}
          </p>
          {word?.wordClue && (
            <p className="mx-auto mt-2 max-w-[36ch] font-sans text-xs leading-relaxed text-[#9ca3af]">
              {word.wordClue}
            </p>
          )}
        </Panel>
      ) : (
        <Panel className="p-5 bg-[#111813] border border-[#202d24]">
          <p className="font-sans font-bold text-sm text-white">
            {isChristCafe ? "Enter Disconnection Timestamp" : "Type the word that differs"}
          </p>
          <p className="mt-1 font-sans text-xs leading-relaxed text-[#9ca3af]">
            {isChristCafe
              ? "Enter the time from Maveli's Instagram post (e.g. 15:12 or 3:12 PM)."
              : "Enter the exact changed word found in this sighting or scan on-site."}
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
              placeholder={isChristCafe ? "15:12" : "THE WORD"}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-label={isChristCafe ? "Disconnection timestamp" : "The word that differs"}
            />
            {error && (
              <p className="flex items-start gap-2 text-xs font-medium text-red-400">
                <WarningCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
            <Btn onClick={submit} disabled={busy} className="w-full justify-center">
              <span>{busy ? "Verifying..." : isChristCafe ? "Verify Timestamp" : "Verify Word"}</span>
              <ArrowRight size={16} />
            </Btn>
          </div>
        </Panel>
      )}

      {hasHint && (
        <Panel tone="teal" className="p-4 bg-[#0e201e] border border-[#10b981]/30">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#6ee7b7]">
            <ShieldWarning size={15} /> Level 1 Hint
          </div>
          <p className="mt-1.5 font-sans text-xs leading-relaxed text-[#9ca3af]">{location.hintText}</p>
        </Panel>
      )}

      <EvidenceBoard />
    </div>
  );
}

/* ---------- Day 1 dead end / night bridge (19:00 - 00:00) ---------- */

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
        <h1 className="font-display mt-2 text-3xl font-extrabold text-white">
          Maveli Has Disappeared
        </h1>
        <p className="mx-auto mt-2 max-w-[38ch] font-sans text-sm leading-relaxed text-[#9ca3af]">
          The Day 1 trail has stopped. Submissions are now closed for the day. Keep an eye out on Maveli&apos;s Instagram page tonight for tomorrow&apos;s clues.
        </p>
      </div>

      <div className="rounded-[14px] border-2 border-[#22c55e] bg-[#112419] p-5 shadow-sm text-white">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-[#090d0b]">
            <InstagramLogo size={24} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-base font-bold text-white">
                Night Broadcast Channel
              </h3>
              <span className="rounded-[4px] bg-[#22c55e] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#090d0b]">
                TONIGHT
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#9ca3af]">
              Keep an eye out on Maveli&apos;s Instagram page (<strong>@maveli.thamburan_</strong>) between 19:00 and 00:00 for Day 2 emergency signals.
            </p>
            <a
              href={settings.instagramUrl}
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

      <Panel tone="mint" className="p-5 bg-[#102117] border border-[#22c55e]/30">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#22c55e]">
          <Radio size={15} className="anim-blink" /> Signal Lost
        </div>
        <p className="mt-2 font-sans text-xs leading-relaxed text-[#9ca3af]">
          {isNight
            ? "Maveli broke radio silence. He is trapped somewhere on campus and has found a way to communicate without the internet. Day 2 begins tomorrow at 14:40."
            : "The trail was deliberate. Maveli was leading us somewhere on purpose. Prepare for Day 2."}
        </p>
      </Panel>

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
      <Panel tone="yellow" className="p-5 bg-[#14261a] border border-[#22c55e]/40">
        <div className="flex items-center gap-2">
          <Radio size={16} className="anim-blink text-[#22c55e]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#86efac]">
            Emergency Transmission
          </span>
        </div>
        <h2 className="font-display mt-2 text-2xl text-white">
          Find the Signal
        </h2>
        <p className="mt-2 font-sans text-xs leading-relaxed text-[#9ca3af]">
          Maveli&apos;s SOS is broadcasting on campus. Reach the area and locate the Emergency Transmission marker.
        </p>
      </Panel>
      {sos && (
        <Panel className="p-4 bg-[#111813] border border-[#202d24]">
          <p className="font-sans text-sm leading-relaxed text-white">{sos.clueText}</p>
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
      <Panel tone="mint" className="p-5 bg-[#102117] border border-[#22c55e]/30">
        <div className="flex items-center gap-2">
          <Leaf size={18} className="anim-blink text-[#22c55e]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#86efac]">
            He is Close
          </span>
        </div>
        <h2 className="font-display mt-2 text-2xl text-white">
          Find the Sanctuary
        </h2>
        <p className="mt-2 font-sans text-xs leading-relaxed text-[#9ca3af]">
          The transmission indicated where Maveli is sheltered. Reach the location and scan the final marker.
        </p>
      </Panel>
      {fin && (
        <Panel className="p-4 bg-[#111813] border border-[#202d24]">
          <p className="font-sans text-sm leading-relaxed text-white">{fin.clueText}</p>
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
      <Panel className="p-5 bg-[#111813] border border-[#202d24]">
        <p className="font-sans text-sm leading-relaxed text-white">
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
        <Leaf size={44} weight="fill" className="mx-auto text-[#22c55e]" />
        <h1 className="font-display mt-3 text-3xl font-extrabold text-white">
          Maveli is Safe!
        </h1>
        <p className="mx-auto mt-2 max-w-[34ch] font-sans text-sm leading-relaxed text-[#9ca3af]">
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
          className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-1 text-xs font-medium text-[#9ca3af] hover:text-[#22c55e]"
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
    <div className="space-y-6 pt-4 text-center">
      <div>
        <TaglineBadge className="mx-auto mb-3">
          <Trophy size={14} weight="fill" /> HUNT CONCLUDED
        </TaglineBadge>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
          The Mystery is Solved!
        </h1>
        <p className="mx-auto mt-2 max-w-[42ch] font-sans text-sm leading-relaxed text-[#9ca3af]">
          Maveli has returned to his kingdom safely. Thank you to every squad who took part in the search across Christ College of Engineering.
        </p>
      </div>

      {winner ? (
        <div className="rounded-[16px] border-2 border-[#22c55e] bg-[#102419] p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#22c55e] text-[#090d0b]">
            <Trophy size={32} weight="fill" />
          </div>
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-[#86efac]">
            🏆 Grand Champions
          </p>
          <h2 className="font-display mt-1 text-2xl sm:text-3xl text-white">
            {winner.name}
          </h2>
          <p className="mt-1 font-sans text-xs text-[#9ca3af]">
            Solved by {winner.member1} & {winner.member2}
          </p>
        </div>
      ) : (
        <Panel tone="mint" className="p-6 bg-[#102117] border border-[#22c55e]/30">
          <Trophy size={36} weight="fill" className="mx-auto text-[#22c55e]" />
          <p className="mt-3 font-sans text-base font-bold text-white">
            Leaderboard Finalizing
          </p>
          <p className="mx-auto mt-1 max-w-[34ch] font-sans text-xs leading-relaxed text-[#9ca3af]">
            Official final standings and award announcements will be shared in the WhatsApp group.
          </p>
        </Panel>
      )}

      {/* Wholesome Community Note */}
      <Panel className="p-5 bg-[#111813] border border-[#202d24] text-left">
        <h3 className="font-sans text-sm font-bold text-white">
          A Big Thank You from FOSS CCE! 💚
        </h3>
        <p className="mt-1.5 font-sans text-xs leading-relaxed text-[#9ca3af]">
          Whether you solved the Mapillary difference, tracked Maveli through Instagram, decoded BitChat, or cracked the Sanctuary Gate — your curiosity and teamwork made this hunt unforgettable.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/leaderboard"
            className="btn btn-primary flex-1 items-center justify-center gap-2 text-xs font-bold py-2.5"
          >
            <Trophy size={16} /> View Final Leaderboard
          </Link>
          <a
            href="https://chat.whatsapp.com/FFQ517Asdpv13omB9ArMwv"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline flex-1 items-center justify-center gap-2 text-xs font-semibold py-2.5"
          >
            <WhatsappLogo size={16} weight="fill" /> Join FOSS Community
          </a>
        </div>
      </Panel>

      <div className="pt-2">
        <EvidenceBoard compact />
      </div>
    </div>
  );
}
