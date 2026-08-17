"use client";

import { Trophy } from "@phosphor-icons/react";
import { Chip, Panel, SectionLabel } from "@/components/ui";
import { rankLabel } from "@/lib/game";
import { cn, formatTime } from "@/lib/utils";
import type { LeaderboardRow } from "@/lib/types";

export function LeaderboardView({
  rows,
  winnerTeamId,
  highlightTeamId,
  showAll,
}: {
  rows: LeaderboardRow[];
  winnerTeamId: string | null;
  highlightTeamId?: string;
  showAll?: boolean;
}) {
  const visible = showAll ? rows : rows.slice(0, 10);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionLabel>Live Leaderboard</SectionLabel>
        <Chip tone="yellow">{rows.length} Squads</Chip>
      </div>

      <Panel className="divide-y divide-[#b6b6b6]/40 p-0 overflow-hidden shadow-sm">
        {visible.length === 0 && (
          <p className="px-4 py-8 text-center font-sans text-sm text-[#888888]">
            No squads registered yet.
          </p>
        )}
        {visible.map((row, i) => {
          const isWinner = row.team.id === winnerTeamId;
          const highlight = row.team.id === highlightTeamId;
          const isFirst = i === 0;

          return (
            <div
              key={row.team.id}
              className={cn(
                "flex items-center gap-3 p-4 transition-colors",
                highlight && "bg-[#d5f5c2]/30",
                isWinner && "bg-[#ffe95c]/30",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] font-mono text-xs font-bold",
                  isFirst
                    ? "bg-[#ffe95c] text-[#1a3300]"
                    : "bg-[#f1f1f1] text-[#666666]",
                )}
              >
                {row.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate font-sans text-sm font-bold text-[#1a3300]">
                  {isWinner && (
                    <Trophy size={16} weight="fill" className="shrink-0 text-[#1a3300]" />
                  )}
                  <span className="truncate">{row.team.name}</span>
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-[#666666]">
                  {row.correctReconstructionAt
                    ? `RESCUED AT ${formatTime(row.correctReconstructionAt)}`
                    : row.scans.length > 0
                      ? `LAST SCAN ${formatTime(
                          Math.max(...row.scans.map((s) => s.at)),
                        )}`
                      : "SQUAD ENROLLED"}
                </div>
              </div>
              <Chip
                tone={row.correctReconstructionAt !== null ? "mint" : "default"}
                className="shrink-0"
              >
                {rankLabel(row)}
              </Chip>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
