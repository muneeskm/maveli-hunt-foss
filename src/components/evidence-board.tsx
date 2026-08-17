"use client";

import { cn } from "@/lib/utils";
import { Panel, SectionLabel, HighlightWord } from "@/components/ui";
import { useGame } from "@/hooks/use-game";

export function EvidenceBoard({ compact }: { compact?: boolean }) {
  const { team, scans, locations, words } = useGame();
  if (!team) return null;

  const sightings = locations
    .filter((l) => l.type === "sighting")
    .sort((a, b) => a.order - b.order);
  const found = new Set(
    scans.filter((s) => s.teamId === team.id).map((s) => s.locationId),
  );

  return (
    <div>
      {!compact && <SectionLabel>Squad Evidence Board</SectionLabel>}
      <Panel className="divide-y divide-[#b6b6b6]/40 p-0 overflow-hidden">
        {sightings.map((loc) => {
          const done = found.has(loc.id);
          return (
            <div
              key={loc.id}
              className={cn(
                "flex items-start gap-3 p-4 transition-colors",
                done ? "bg-[#d5f5c2]/20" : "bg-white opacity-60",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 rounded-[4px] px-2 py-0.5 font-mono text-[10px] font-semibold",
                  done ? "bg-[#ffe95c] text-[#1a3300]" : "bg-[#f1f1f1] text-[#888888]",
                )}
              >
                0{loc.order}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {done ? (
                    <span className="font-mono text-sm font-bold tracking-widest text-[#1a3300] bg-[#ffe95c] px-2 py-0.5 rounded-[4px]">
                      {words[loc.id]?.word ?? "?????"}
                    </span>
                  ) : (
                    <span className="font-mono text-sm font-medium tracking-widest text-[#888888]">
                      •••••
                    </span>
                  )}
                  <span className="text-xs font-semibold text-[#1a3300] truncate">
                    {loc.name}
                  </span>
                </div>
                <div className="mt-1 text-xs leading-relaxed text-[#555555]">
                  {done ? words[loc.id]?.wordClue ?? "Evidence recovered and verified." : "Evidence not yet discovered on campus."}
                </div>
              </div>
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  done ? "bg-[#1a3300]" : "bg-[#b6b6b6]",
                )}
              />
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
