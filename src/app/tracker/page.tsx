"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  BitchatStage,
  DeadEndStage,
  EndedStage,
  FinalStage,
  GateStage,
  RescuedStage,
  SightingStage,
  SosStage,
  StandbyStage,
  TeamBadge,
} from "@/components/stages";
import { useGame, useMounted } from "@/hooks/use-game";
import { stageOf } from "@/lib/game";

export default function TrackerPage() {
  const router = useRouter();
  const mounted = useMounted();
  const { team, game, settings, scans, answers, hints, broadcasts, locations } =
    useGame();

  useEffect(() => {
    if (mounted && !team) router.replace("/");
  }, [mounted, team, router]);

  if (!mounted || !team) return null;

  const stage = stageOf(team.id, game.phase, locations, scans, answers, true);

  return (
    <AppShell
      phase={game.phase}
      teamName={team.name}
      teamId={team.id}
      broadcasts={broadcasts}
      settings={settings}
    >
      <TeamBadge />

      {stage.key === "waiting" && <StandbyStage />}

      {stage.key.startsWith("sighting-") && stage.location && (
        <SightingStage location={stage.location} />
      )}

      {stage.key === "deadend" && <DeadEndStage />}
      {stage.key === "sos" && <SosStage />}
      {stage.key === "bitchat" && <BitchatStage />}
      {stage.key === "final" && <FinalStage />}
      {(stage.key === "gate" || stage.key === "gate-wait") && <GateStage />}
      {stage.key === "rescued" && <RescuedStage />}
      {stage.key === "ended" && <EndedStage />}

      <div className="mt-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-moss">
          FOSS Mavelli Hunt
        </p>
      </div>
    </AppShell>
  );
}
