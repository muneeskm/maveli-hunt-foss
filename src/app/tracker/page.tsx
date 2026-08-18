"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CountdownTimer } from "@/components/countdown-timer";
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
        <div className="flex min-h-[100dvh] items-center justify-center bg-transparent">
          <div className="text-center">
            <span className="anim-blink mx-auto block h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
            <p className="mt-3 font-mono text-xs uppercase tracking-widest text-[#22c55e]">
              Syncing team...
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
      <CountdownTimer className="mb-4" />

      <TeamBadge />

      {stage.key === "waiting" && <StandbyStage />}

      {stage.key.startsWith("sighting-") && stage.location && (
        <SightingStage key={stage.key} location={stage.location} />
      )}

      {stage.key === "deadend" && <DeadEndStage />}
      {stage.key === "sos" && <SosStage />}
      {stage.key === "bitchat" && <BitchatStage />}
      {stage.key === "final" && <FinalStage />}
      {(stage.key === "gate" || stage.key === "gate-wait") && <GateStage />}
      {stage.key === "rescued" && <RescuedStage />}
      {stage.key === "ended" && <EndedStage />}

      {game.phase !== "setup" && (
        <div className="mt-10">
          <Timeline />
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/maveli-logo.png"
          alt="The Maveli Files"
          className="h-10 w-10 rounded-full border border-white/20 object-cover shadow-sm"
        />
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#cbd5e1]">
          The Maveli Files
        </p>
        <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/foss-logo.png"
            alt="FOSS CCE"
            className="h-7 w-7 rounded-full border border-white/20 object-cover"
          />
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#cbd5e1]">
            Conducted by FOSS CCE
          </span>
        </div>
      </div>
    </AppShell>
  );
}
