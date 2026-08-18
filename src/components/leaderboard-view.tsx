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

      <Panel className="divide-y divide-[rgba(56,189,248,0.15)] p-0 overflow-hidden shadow-xl">
        {visible.length === 0 && (
          <p className="px-4 py-8 text-center font-sans text-sm text-[#94a3b8]">
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
                highlight && "bg-[#14281b] border-l-4 border-l-[#22c55e]",
                isWinner && "bg-[#162f1e]",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] font-mono text-xs font-bold",
                  isFirst
                    ? "bg-[#22c55e] text-[#090d0b]"
                    : "bg-[#16221a] text-[#9ca3af]",
                )}
              >
                {row.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate font-sans text-sm font-bold text-white">
                  {isWinner && (
                    <Trophy size={16} weight="fill" className="shrink-0 text-[#22c55e]" />
                  )}
                  <span className="truncate">{row.team.name}</span>
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-[#9ca3af]">
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
