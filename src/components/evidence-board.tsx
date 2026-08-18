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
      <Panel className="divide-y divide-[#202d24] p-0 overflow-hidden bg-[#111813] border border-[#202d24]">
        {sightings.map((loc) => {
          const done = found.has(loc.id);
          return (
            <div
              key={loc.id}
              className={cn(
                "flex items-start gap-3 p-4 transition-colors",
                done ? "bg-[#102317]/60" : "bg-[#111813] opacity-60",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 rounded-[4px] px-2 py-0.5 font-mono text-[10px] font-bold",
                  done ? "bg-[#22c55e] text-[#090d0b]" : "bg-[#16221a] text-[#6b7280]",
                )}
              >
                0{loc.order}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {done ? (
                    <span className="font-mono text-sm font-bold tracking-widest text-[#22c55e] bg-[#14281b] border border-[#22c55e]/40 px-2 py-0.5 rounded-[4px]">
                      {words[loc.id]?.word ?? "?????"}
                    </span>
                  ) : (
                    <span className="font-mono text-sm font-medium tracking-widest text-[#6b7280]">
                      •••••
                    </span>
                  )}
                  <span className="text-xs font-semibold text-white truncate">
                    {loc.name}
                  </span>
                </div>
                <div className="mt-1 text-xs leading-relaxed text-[#9ca3af]">
                  {done ? words[loc.id]?.wordClue ?? "Evidence recovered and verified." : "Evidence not yet discovered on campus."}
                </div>
              </div>
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  done ? "bg-[#22c55e] shadow-[0_0_6px_#22c55e]" : "bg-[#202d24]",
                )}
              />
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
