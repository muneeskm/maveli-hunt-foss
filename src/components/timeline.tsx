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
        title: "The hunt begins",
        detail: "Mavelli was last seen somewhere on campus.",
        meta: `Started ${formatTime(team?.createdAt ?? Date.now())}`,
        section: "Day 1",
      },
      ...sightings.map((loc) => {
        const done = solvedCount >= loc.order;
        const word = words[loc.id];
        return {
          key: loc.id,
          icon: <MapPin size={16} weight="fill" />,
          title: loc.name,
          detail: done
            ? word
              ? `Word recovered: ${word.word}`
              : "Evidence recovered"
            : "Evidence not recovered",
          meta: done && scanAt(loc.id) ? `Recovered ${formatTime(scanAt(loc.id)!)}` : undefined,
        };
      }),
      {
        key: "deadend",
        icon: <X size={16} weight="bold" />,
        title: "The trail goes cold",
        detail: "The last clue led nowhere. Mavelli has disappeared.",
        meta: "Day 1 ends",
        section: "Night",
      },
      {
        key: "sos",
        icon: <Radio size={16} weight="fill" />,
        title: "Emergency transmission",
        detail: "Find the MAVELLI EMERGENCY TRANSMISSION poster and scan it.",
        section: "Day 2",
      },
      {
        key: "bitchat",
        icon: <ChatCircle size={16} weight="fill" />,
        title: "BitChat transmission",
        detail: "Enter the code from Mavelli's message.",
      },
      {
        key: "final",
        icon: <Detective size={16} weight="fill" />,
        title: "The hiding place",
        detail: "Reconstruct the five words in the exact order.",
      },
      {
        key: "rescued",
        icon: <CheckCircle size={16} weight="fill" />,
        title: "Mavelli is safe",
        detail: "Your team completed the hunt.",
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
      <SectionLabel>Your Trail</SectionLabel>
      <ol className="relative mt-2">
        {/* the rail */}
        <span
          className="absolute bottom-5 left-4 top-5 w-px bg-[#b6b6b6]"
          aria-hidden="true"
        />

        {entries.map((e) => (
          <li key={e.key} className="relative">
            {e.section && (
              <div className="flex items-center pb-2 pt-1">
                <span className="relative z-10 ml-[7px] bg-[#fcfaf5] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#1a3300]">
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
                  e.status === "done" && "border-[#1a3300] bg-[#1a3300] text-[#fcfaf5]",
                  e.status === "current" &&
                    "anim-blink border-[#1a3300] bg-[#ffe95c] text-[#1a3300]",
                  e.status === "upcoming" && "border-[#b6b6b6] bg-white text-[#888888]",
                )}
              >
                {e.icon}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={cn(
                    "text-[15px] font-semibold leading-snug text-[#1a3300]",
                    e.status === "upcoming" && "text-[#777777]",
                  )}
                >
                  {e.title}
                </p>
                {e.detail && (
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#555555]">
                    {e.detail}
                  </p>
                )}
                {e.meta && (
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#888888]">
                    {e.meta}
                  </p>
                )}
              </div>

              <span
                className={cn(
                  "mt-1 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider",
                  e.status === "done" && "text-[#1a3300]",
                  e.status === "current" && "text-[#1a3300] bg-[#ffe95c] px-1.5 py-0.5 rounded-[4px]",
                  e.status === "upcoming" && "text-[#888888]",
                )}
              >
                {e.status === "done"
                  ? "Recovered"
                  : e.status === "current"
                    ? "Here"
                    : "Up next"}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
