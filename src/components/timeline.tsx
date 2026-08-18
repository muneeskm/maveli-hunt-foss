"use client";

import { useMemo, type ReactNode } from "react";
import {
  ChatCircle,
  CheckCircle,
  Detective,
  Flag,
  MapPin,
  Radio,
  X,
} from "@phosphor-icons/react";
import { SectionLabel } from "@/components/ui";
import { SIGHTINGS } from "@/lib/game";
import { useGame } from "@/hooks/use-game";
import { cn, formatTime } from "@/lib/utils";

/*
 * Google-Maps-timeline style view of the team's journey through the hunt.
 * A vertical rail connects circular badges: places are icons in badges, phase
 * transitions are tiny labels sitting on the rail (DAY 1 / NIGHT / DAY 2).
 * Done entries are green, the entry the team is on pulses, the rest are dim.
 */

type Status = "done" | "current" | "upcoming";

interface Entry {
  key: string;
  icon: ReactNode;
  title: string;
  detail?: string;
  meta?: string;
  section?: string;
  status: Status;
}

export function Timeline() {
  const { team, locations, scans, answers, words } = useGame();

  const cakeFarmScanned = useMemo(
    () => scans.some((s) => s.locationId === "s2" || s.locationId === "s1"),
    [scans],
  );

  const entries = useMemo<Entry[]>(() => {
    const sightings = locations
      .filter((l) => l.type === "sighting")
      .sort((a, b) => a.order - b.order);
    const solvedCount = sightings.filter((l) =>
      scans.some((s) => s.locationId === l.id),
    ).length;
    const sosScanned = scans.some((s) => s.locationId === "sos");
    const finScanned = scans.some((s) => s.locationId === "fin");
    const bitchatOk = answers.some((a) => a.kind === "bitchat" && a.correct);
    const rescued = answers.some(
      (a) => a.kind === "reconstruction" && a.correct,
    );

    const scanAt = (locationId: string) =>
      scans.find((s) => s.locationId === locationId)?.at;

    const raw: Omit<Entry, "status">[] = [
      {
        key: "start",
        icon: <Flag size={16} weight="fill" />,
        title: "The Arrival — Campus Gate",
        detail: "Maveli entered Christ College of Engineering.",
        meta: `Recorded ${formatTime(team?.createdAt ?? Date.now())}`,
        section: "Day 1",
      },
      ...sightings.map((loc) => {
        const isDone = solvedCount >= loc.order;
        const word = words[loc.id];
        const isRedactedChristCafe = loc.id === "s3";

        return {
          key: loc.id,
          icon: <MapPin size={16} weight="fill" />,
          title: isRedactedChristCafe ? "████ ████ ████" : loc.name,
          detail: isRedactedChristCafe
            ? isDone
              ? "Christ Cafe — Disconnection timestamp verified."
              : "[SIGNAL LOST — MAVELI WENT OFFLINE AT THIS WAYPOINT]"
            : isDone
              ? word
                ? `Evidence recovered: "${word.word}"`
                : "Waypoint confirmed"
              : "Classified campus waypoint",
          meta: isRedactedChristCafe && !isDone
            ? "Maveli Offline"
            : isDone && scanAt(loc.id)
              ? `Confirmed ${formatTime(scanAt(loc.id)!)}`
              : undefined,
        };
      }),
      {
        key: "deadend",
        icon: <X size={16} weight="bold" />,
        title: "The trail goes cold",
        detail: "Maveli vanished from campus surveillance.",
        meta: "Day 1 ends",
        section: "Night",
      },
      {
        key: "sos",
        icon: <Radio size={16} weight="fill" />,
        title: "Emergency transmission",
        detail: "Find the MAVELI EMERGENCY TRANSMISSION poster.",
        section: "Day 2",
      },
      {
        key: "bitchat",
        icon: <ChatCircle size={16} weight="fill" />,
        title: "BitChat transmission",
        detail: "Verify the transmission passcode from Maveli.",
      },
      {
        key: "final",
        icon: <Detective size={16} weight="fill" />,
        title: "Sanctuary Gate",
        detail: "Reconstruct the recovered words in exact sequence.",
      },
      {
        key: "rescued",
        icon: <CheckCircle size={16} weight="fill" />,
        title: "Maveli is safe",
        detail: "Your squad solved the mystery.",
      },
    ];

    const isDone = (e: Omit<Entry, "status">): boolean => {
      switch (e.key) {
        case "start":
          return true;
        case "deadend":
          return solvedCount === SIGHTINGS;
        case "sos":
          return sosScanned;
        case "bitchat":
          return bitchatOk;
        case "final":
          return finScanned;
        case "rescued":
          return rescued;
        default:
          return scans.some((s) => s.locationId === e.key); // sightings s1..s5
      }
    };

    // mark done / current / upcoming in order: first unfinished entry pulses
    let seenCurrent = false;
    return raw.map((e) => {
      if (isDone(e)) return { ...e, status: "done" as Status };
      if (!seenCurrent) {
        seenCurrent = true;
        return { ...e, status: "current" as Status };
      }
      return { ...e, status: "upcoming" as Status };
    });
  }, [team, locations, scans, answers, words]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <SectionLabel>Maveli&apos;s Campus Timeline</SectionLabel>
        {cakeFarmScanned && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#22c55e]">
            ● Unlocked
          </span>
        )}
      </div>

      {!cakeFarmScanned ? (
        <div className="mt-2 rounded-[14px] border border-[#202d24] bg-[#111813] p-5 text-center shadow-sm">
          <p className="font-mono text-xs uppercase tracking-wider text-[#86efac]">
            Route Encryption Active
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#9ca3af]">
            Maveli&apos;s campus timeline is encrypted. Scan the QR code at <strong>Cake Farm Cafe</strong> to unlock his full route history.
          </p>
        </div>
      ) : (
        <ol className="relative mt-2">
          {/* the rail */}
          <span
            className="absolute bottom-5 left-4 top-5 w-px bg-[#202d24]"
            aria-hidden="true"
          />

          {entries.map((e) => (
            <li key={e.key} className="relative">
              {e.section && (
                <div className="flex items-center pb-2 pt-1">
                  <span className="relative z-10 ml-[7px] bg-[#090d0b] border border-[#202d24] rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#22c55e]">
                    {e.section}
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "relative flex items-start gap-4 pb-6",
                  e.status === "upcoming" && "opacity-45",
                )}
              >
                {/* badge on the rail */}
                <span
                  className={cn(
                    "relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                    e.status === "done" && "border-[#22c55e] bg-[#14281b] text-[#22c55e]",
                    e.status === "current" &&
                      "anim-blink border-[#22c55e] bg-[#22c55e] text-[#090d0b]",
                    e.status === "upcoming" && "border-[#202d24] bg-[#111813] text-[#6b7280]",
                  )}
                >
                  {e.icon}
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={cn(
                      "text-[15px] font-semibold leading-snug text-white",
                      e.title.includes("████") && "font-mono tracking-widest text-[#22c55e]",
                      e.status === "upcoming" && !e.title.includes("████") && "text-[#6b7280]",
                    )}
                  >
                    {e.title}
                  </p>
                  {e.detail && (
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[#9ca3af]">
                      {e.detail}
                    </p>
                  )}
                  {e.meta && (
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#86efac]">
                      {e.meta}
                    </p>
                  )}
                </div>

                <span
                  className={cn(
                    "mt-1 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider",
                    e.status === "done" && "text-[#22c55e]",
                    e.status === "current" && "text-[#090d0b] bg-[#22c55e] px-1.5 py-0.5 rounded-[4px] font-bold",
                    e.status === "upcoming" && "text-[#6b7280]",
                  )}
                >
                  {e.status === "done"
                    ? "Confirmed"
                    : e.status === "current"
                      ? "Active"
                      : "Upcoming"}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
