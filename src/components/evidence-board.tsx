"use client";

import { cn } from "@/lib/utils";
import { Panel, SectionLabel } from "@/components/ui";
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
      {!compact && <SectionLabel>Evidence board</SectionLabel>}
      <Panel className="divide-y divide-line">
        {sightings.map((loc) => {
          const done = found.has(loc.id);
          return (
            <div
              key={loc.id}
              className={cn(
                "flex items-start gap-3 px-4 py-3",
                !done && "opacity-45",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 font-mono text-[11px] tracking-widest",
                  done ? "text-leaf" : "text-moss",
                )}
              >
                {String(loc.order).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-sm font-bold tracking-[0.2em] text-mist">
                  {done ? words[loc.id]?.word ?? "?????" : "?????"}
                </div>
                <div className="mt-0.5 text-xs leading-relaxed text-fog">
                  {done ? words[loc.id]?.wordClue ?? "Evidence not recovered" : "Evidence not recovered"}
                </div>
              </div>
              <span
                className={cn(
                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                  done ? "bg-leaf" : "bg-line-2",
                )}
              />
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
