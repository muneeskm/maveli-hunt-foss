"use client";

import { AppShell } from "@/components/app-shell";
import { LeaderboardView } from "@/components/leaderboard-view";
import { useGame } from "@/hooks/use-game";

export default function LeaderboardPage() {
  const {
    team,
    game,
    settings,
    broadcasts,
    scans,
    answers,
    locations,
    teams,
  } = useGame();

  return (
    <AppShell
      phase={game.phase}
      teamName={team?.name}
      teamId={team?.id}
      broadcasts={broadcasts}
      settings={settings}
    >
      <LeaderboardView
        teams={teams}
        scans={scans}
        answers={answers}
        locations={locations}
        winnerTeamId={game.winnerTeamId}
        highlightTeamId={team?.id}
        showAll
      />
    </AppShell>
  );
}
