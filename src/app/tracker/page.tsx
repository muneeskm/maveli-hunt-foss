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
import { Timeline } from "@/components/timeline";
import { useGame, useMounted } from "@/hooks/use-game";
import { stageOf } from "@/lib/game";

export default function TrackerPage() {
  const router = useRouter();
  const mounted = useMounted();
  const { team, game, settings, scans, answers, hints, broadcasts, locations, sessionPending } =
    useGame();

  useEffect(() => {
    if (mounted && !team && !sessionPending) router.replace("/");
  }, [mounted, team, sessionPending, router]);

  if (!mounted) return null;
  if (!team) {
    if (sessionPending) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-ink">
          <div className="text-center">
            <span className="anim-blink mx-auto block h-2 w-2 rounded-full bg-leaf" />
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.24em] text-fog">
              Syncing your team...
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

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

      <div className="mt-10">
        <Timeline />
      </div>

      <div className="mt-8 flex flex-col items-center gap-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/foss-logo.png"
          alt="FOSS CCE"
          className="h-8 w-8 rounded-full object-cover"
        />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-moss">
          FOSS Mavelli Hunt
        </p>
      </div>
    </AppShell>
  );
}
