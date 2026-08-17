"use client";

import { Trophy } from "@phosphor-icons/react";
import { Chip, Panel, SectionLabel } from "@/components/ui";
import { rankLabel, ranking } from "@/lib/game";
import { store } from "@/lib/store";
import { cn, formatTime } from "@/lib/utils";
import type { Team } from "@/lib/types";

export function LeaderboardView({
  teams,
  scans,
  answers,
  locations,
  winnerTeamId,
  highlightTeamId,
  showAll,
}: {
  teams: Team[];
  scans: ReturnType<typeof store.teamScans>;
  answers: ReturnType<typeof store.teamAnswers>;
  locations: ReturnType<typeof store.locations>;
  winnerTeamId: string | null;
  highlightTeamId?: string;
  showAll?: boolean;
}) {
  const rows = ranking(teams, scans, answers, locations, winnerTeamId);
  const visible = showAll ? rows : rows.slice(0, 10);

  return (
    <div>
      <SectionLabel>Live leaderboard</SectionLabel>
      <Panel className="divide-y divide-line">
        {visible.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-fog">
            No teams have signed up yet.
          </p>
        )}
        {visible.map((row, i) => {
          const isWinner = row.team.id === winnerTeamId;
          const highlight = row.team.id === highlightTeamId;
          return (
            <div
              key={row.team.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                highlight && "bg-leaf/10",
              )}
            >
              <span
                className={cn(
                  "w-7 shrink-0 text-center font-mono text-sm font-bold",
                  i === 0 ? "text-leaf" : "text-fog",
                )}
              >
                {String(row.rank).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-sm font-medium text-mist">
                  {isWinner && <Trophy size={14} className="shrink-0 text-leaf" />}
                  <span className="truncate">{row.team.name}</span>
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-moss">
                  {row.correctReconstructionAt
                    ? `RESCUED AT ${formatTime(row.correctReconstructionAt)}`
                    : row.scans.length > 0
                      ? `LAST SCAN ${formatTime(
                          Math.max(...row.scans.map((s) => s.at)),
                        )}`
                      : "SIGNED UP"}
                </div>
              </div>
              <Chip
                tone={row.correctReconstructionAt !== null ? "leaf" : "default"}
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
