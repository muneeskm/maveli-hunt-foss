"use client";

import { useEffect, useReducer } from "react";
import { store } from "@/lib/store";

export function useGame() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => store.subscribe(() => force()), []);
  const team = store.sessionTeam();
  return {
    team,
    game: store.game(),
    settings: store.settings(),
    teams: store.teams(),
    scans: team ? store.teamScans(team.id) : [],
    answers: team ? store.teamAnswers(team.id) : [],
    hints: team ? store.teamHints(team.id) : [],
    broadcasts: store.broadcasts(),
    locations: store.locations(),
    refresh: force,
  };
}

export function useMounted() {
  const [mounted, setMounted] = useReducer(() => true, false);
  useEffect(() => setMounted(), []);
  return mounted;
}
