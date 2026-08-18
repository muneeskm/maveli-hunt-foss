import type {
  Answer,
  Broadcast,
  GameLocation,
  GameState,
  LeaderboardRow,
  Phase,
  Scan,
  StageInfo,
  Team,
} from "./types";

export const SIGHTINGS = 5;

export function sightingScans(teamId: string, scans: Scan[], locations: GameLocation[]) {
  const sightingIds = locations
    .filter((l) => l.type === "sighting")
    .sort((a, b) => a.order - b.order)
    .map((l) => l.id);
  return sightingIds.filter((id) =>
    scans.some((s) => s.teamId === teamId && s.locationId === id),
  );
}

export function progressOf(teamId: string, scans: Scan[]): number {
  return scans.filter((s) => s.teamId === teamId).length;
}

export function correctAnswerAt(
  teamId: string,
  answers: Answer[],
  kind: "bitchat" | "reconstruction",
): number | null {
  const found = answers.find(
    (a) => a.teamId === teamId && a.kind === kind && a.correct,
  );
  return found ? found.at : null;
}

export function scannedLocationIds(teamId: string, scans: Scan[]) {
  return new Set(
    scans.filter((s) => s.teamId === teamId).map((s) => s.locationId),
  );
}

export function stageOf(
  teamId: string,
  phase: Phase,
  locations: GameLocation[],
  scans: Scan[],
  answers: Answer[],
  gateOpen: boolean,
): StageInfo {
  const sightingIds = locations
    .filter((l) => l.type === "sighting")
    .sort((a, b) => a.order - b.order);
  const solved = sightingScans(teamId, scans, locations).length;
  const sosScanned = scans.some(
    (s) => s.teamId === teamId && s.locationId === "sos",
  );
  const finalScanned = scans.some(
    (s) => s.teamId === teamId && s.locationId === "fin",
  );
  const bitchatOk = correctAnswerAt(teamId, answers, "bitchat") !== null;
  const rescued = correctAnswerAt(teamId, answers, "reconstruction") !== null;

  if (rescued) return { key: "rescued", label: "Rescued" };
  if (phase === "ended") return { key: "ended", label: "Event over" };

  if (phase === "day1" || phase === "night") {
    if (solved < SIGHTINGS) {
      const next = sightingIds[solved];
      return { key: `sighting-${next.order}`, label: next.name, location: next };
    }
    return { key: "deadend", label: "Day 1 dead end" };
  }

  if (phase === "day2" || phase === "rescued") {
    if (!sosScanned) return { key: "sos", label: "SOS search" };
    if (!bitchatOk) return { key: "bitchat", label: "BitChat" };
    if (!finalScanned) return { key: "final", label: "Final hunt" };
    if (!gateOpen) return { key: "gate-wait", label: "Gate" };
    return { key: "gate", label: "Final gate" };
  }

  // setup or anything else
  return { key: "waiting", label: "Waiting for the hunt to begin" };
}

export function ranking(
  teams: Team[],
  scans: Scan[],
  answers: Answer[],
  locations: GameLocation[],
  winnerTeamId: string | null,
): LeaderboardRow[] {
  const rows: LeaderboardRow[] = teams.map((team) => {
    const teamScans = scans.filter((s) => s.teamId === team.id);
    return {
      team,
      scans: teamScans,
      correctReconstructionAt: correctAnswerAt(team.id, answers, "reconstruction"),
      rank: 0,
    };
  });

  rows.sort((a, b) => {
    const aDone = a.correctReconstructionAt !== null;
    const bDone = b.correctReconstructionAt !== null;
    if (aDone && bDone) return a.correctReconstructionAt! - b.correctReconstructionAt!;
    if (aDone !== bDone) return aDone ? -1 : 1;
    const aProgress = sightingScans(a.team.id, scans, locations).length;
    const bProgress = sightingScans(b.team.id, scans, locations).length;
    if (aProgress !== bProgress) return bProgress - aProgress;
    const aLast = a.scans.length ? Math.max(...a.scans.map((s) => s.at)) : a.team.createdAt;
    const bLast = b.scans.length ? Math.max(...b.scans.map((s) => s.at)) : b.team.createdAt;
    return aLast - bLast;
  });

  rows.forEach((r, i) => {
    r.rank = i + 1;
  });

  // winner always first if set
  if (winnerTeamId) {
    const wi = rows.findIndex((r) => r.team.id === winnerTeamId);
    if (wi > 0) {
      const [winner] = rows.splice(wi, 1);
      rows.unshift(winner);
      rows.forEach((r, i) => {
        r.rank = i + 1;
      });
    }
  }
  return rows;
}

export function rankLabel(row: LeaderboardRow): string {
  if (row.correctReconstructionAt !== null) return "FINISHED";
  const progress = row.scans.length;
  if (progress === 0) return "SIGNED UP";
  return `SIGHTING ${Math.min(progress, SIGHTINGS)}`;
}

export function gateStatus(game: GameState) {
  return {
    answer: game.gateAnswer,
    slots: game.gateSlots,
  };
}

export function isBroadcastVisible(
  broadcast: Broadcast,
  phase: Phase,
  teamId?: string | null,
): boolean {
  if (broadcast.audience === "team") {
    return Boolean(teamId && broadcast.teamId === teamId);
  }
  if (broadcast.audience === "day1") {
    return phase === "day1" || phase === "night";
  }
  if (broadcast.audience === "day2") {
    return phase === "day2" || phase === "rescued";
  }
  return true; // "all" audience is always visible
}

export function filterBroadcastsForTeam(
  broadcasts: Broadcast[],
  phase: Phase,
  teamId?: string | null,
): Broadcast[] {
  return broadcasts.filter((b) => isBroadcastVisible(b, phase, teamId));
}

