"use client";

import { AppShell } from "@/components/app-shell";
import { LeaderboardView } from "@/components/leaderboard-view";
import { useGame } from "@/hooks/use-game";

export default function LeaderboardPage() {
  const { team, game, settings, broadcasts, leaderboard } = useGame();

  return (
    <AppShell
      phase={game.phase}
      teamName={team?.name}
      teamId={team?.id}
      broadcasts={broadcasts}
      settings={settings}
    >
      <LeaderboardView
        rows={leaderboard}
        winnerTeamId={game.winnerTeamId}
        highlightTeamId={team?.id}
        showAll
      />
    </AppShell>
  );
}
