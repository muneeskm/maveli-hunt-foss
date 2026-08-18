import { seedGame, seedLocations, seedSettings } from "./seed";
import type {
  Answer,
  Broadcast,
  DB,
  GameLocation,
  GameState,
  Hint,
  LeaderboardRow,
  Phase,
  Scan,
  ScanResult,
  Settings,
  SubmitResult,
  Team,
} from "./types";

/*
 * REAL-MODE STORE (server-proxy).
 *
 * The client NEVER talks to Supabase directly in real mode. Everything goes
 * through the Next.js API routes (src/app/api/*), which verify answers with
 * the service-role key. This store keeps the same synchronous read API as the
 * demo store so every page works unchanged:
 *
 *   - an in-memory cache holds the team's state payload, refreshed by polling
 *     GET /api/team/state every POLL_MS (4s) - privacy rules out anon-key
 *     realtime, and a tiny JSON poll is far cheaper than it sounds
 *   - mutations call the API and are authoritative: correctness and gate
 *     locks come from the server, never from client-side data
 *   - the admin dashboard gets its own state poll (GET /api/admin/state) and
 *     every admin action goes through POST /api/admin/action
 *
 * Privacy: the cache only ever contains what the server decides to return -
 * unearned words, gate answers, codes, and other teams' answers never reach
 * the client.
 */

const SESSION_KEY = "mh:session";
const ADMIN_SESSION_KEY = "mh:admin";
const POLL_MS = 4000;

interface TeamCache {
  team: Team | null;
  game: GameState;
  settings: Settings;
  locations: GameLocation[];
  scans: Scan[];
  answers: Answer[];
  hints: Hint[];
  words: Record<string, { word: string; wordClue: string }>;
  broadcasts: Broadcast[];
  leaderboard: LeaderboardRow[];
  gateLockSeconds: number;
  rev: number;
}

let teamCache: TeamCache = emptyTeamCache();
let adminCache: DB | null = null;
let adminCode = "";
let pollTimer: number | null = null;
// browser setInterval returns number; keep the type narrow for SSR safety
const listeners = new Set<() => void>();

function emptyTeamCache(): TeamCache {
  return {
    team: null,
    game: { ...seedGame(), gateAnswer: [] },
    settings: seedSettings(),
    locations: seedLocations(),
    scans: [],
    answers: [],
    hints: [],
    words: {},
    broadcasts: [],
    leaderboard: [],
    gateLockSeconds: 0,
    rev: 0,
  };
}

function notify() {
  listeners.forEach((cb) => cb());
}

function sessionCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) {
    throw new Error((data as { message?: string; error?: string }).message ?? `Request failed (${res.status})`);
  }
  return data;
}

let initialTeamPollDone = false;

async function refreshTeamState(code: string) {
  try {
    const { state } = await api<{
      state: {
        rev: number;
        team: Team | null;
        game: { phase: Phase; winnerTeamId: string | null; gateSlots: string[]; startedAt: number };
        settings: Settings;
        locations: GameLocation[];
        scans: Scan[];
        answers: Answer[];
        hints: Hint[];
        words: Record<string, { word: string; wordClue: string }>;
        broadcasts: Broadcast[];
        leaderboard: LeaderboardRow[];
        gateLockSeconds: number;
      };
    }>(`/api/team/state?code=${encodeURIComponent(code)}`);
    initialTeamPollDone = true;
    if (!state.team) {
      if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
      teamCache = emptyTeamCache();
      notify();
      return;
    }
    if (state.rev === teamCache.rev && state.team?.id === teamCache.team?.id) return;
    teamCache = {
      team: state.team,
      game: {
        phase: state.game.phase,
        winnerTeamId: state.game.winnerTeamId,
        gateSlots: state.game.gateSlots,
        startedAt: state.game.startedAt,
        gateAnswer: [],
      },
      settings: state.settings,
      locations: state.locations,
      scans: state.scans,
      answers: state.answers,
      hints: state.hints,
      words: state.words,
      broadcasts: state.broadcasts,
      leaderboard: state.leaderboard,
      gateLockSeconds: state.gateLockSeconds,
      rev: state.rev,
    };
    notify();
  } catch (e) {
    console.error("team state poll", e);
    initialTeamPollDone = true;
    notify();
  }
}

async function refreshAdminState() {
  if (!adminCode) return;
  try {
    const { db } = await api<{ db: DB }>(`/api/admin/state?code=${encodeURIComponent(adminCode)}`);
    adminCache = db;
    notify();
  } catch (e) {
    console.error("admin state poll", e);
  }
}

function startPolling() {
  if (pollTimer) return;
  const tick = () => {
    const code = sessionCode();
    if (code) void refreshTeamState(code);
    if (adminCode) void refreshAdminState();
  };
  tick();
  pollTimer = window.setInterval(tick, POLL_MS);
}

async function adminCall(action: string, payload: Record<string, unknown>) {
  if (!adminCode) return;
  try {
    const res = await api<{ ok: boolean }>("/api/admin/action", {
      method: "POST",
      body: JSON.stringify({ code: adminCode, action, payload }),
    });
    if (res.ok) void refreshAdminState();
  } catch (e) {
    console.error(`admin action ${action}`, e);
  }
}

export const httpStore = {
  /* ---------- game ---------- */
  game(): GameState {
    return teamCache.game;
  },
  setPhase(phase: Phase): Promise<void> {
    return adminCall("phase", { phase });
  },
  setWinner(teamId: string | null): Promise<void> {
    return adminCall("winner", { teamId });
  },

  /* ---------- locations ---------- */
  locations(): GameLocation[] {
    return teamCache.locations;
  },
  locationByToken(token: string): GameLocation | undefined {
    return teamCache.locations.find((l) => l.token === token);
  },

  /* ---------- teams ---------- */
  teams(): Team[] {
    return teamCache.leaderboard.map((r) => r.team);
  },
  teamById(id: string): Team | undefined {
    return this.teams().find((t) => t.id === id);
  },
  teamByCode(code: string): Team | undefined {
    const clean = code.trim().toUpperCase();
    return this.teams().find((t) => t.code === clean);
  },
  async createTeam(
    name: string,
    member1: string,
    member2: string,
    member1Sem = "",
    member1Class = "",
    member2Sem = "",
    member2Class = "",
  ): Promise<Team> {
    const { team } = await api<{ team: Team }>("/api/team/create", {
      method: "POST",
      body: JSON.stringify({
        name,
        member1,
        member2,
        member1Sem,
        member1Class,
        member2Sem,
        member2Class,
      }),
    });
    if (typeof window !== "undefined") window.localStorage.setItem(SESSION_KEY, team.code);
    teamCache.team = team;
    notify();
    void refreshTeamState(team.code);
    return team;
  },
  addTeam(
    name: string,
    member1: string,
    member2: string,
    member1Sem = "",
    member1Class = "",
    member2Sem = "",
    member2Class = "",
  ): Promise<Team> {
    return this.createTeam(
      name,
      member1,
      member2,
      member1Sem,
      member1Class,
      member2Sem,
      member2Class,
    );
  },

  /* ---------- session ---------- */
  sessionTeam(): Team | undefined {
    const code = sessionCode();
    if (!code) return undefined;
    if (teamCache.team && teamCache.team.code === code) return teamCache.team;
    return undefined;
  },
  async login(code: string): Promise<Team | undefined> {
    try {
      const { team } = await api<{ team: Team }>("/api/team/login", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (typeof window !== "undefined") window.localStorage.setItem(SESSION_KEY, team.code);
      teamCache.team = team;
      notify();
      void refreshTeamState(team.code);
      return team;
    } catch {
      return undefined;
    }
  },
  logout() {
    if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
    teamCache = emptyTeamCache();
    notify();
  },
  /** true while a session code exists but the first state poll has not landed */
  sessionPending(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(window.localStorage.getItem(SESSION_KEY)) && !teamCache.team && !initialTeamPollDone;
  },

  /* ---------- scans ---------- */
  teamScans(teamId: string): Scan[] {
    return teamCache.scans.filter((s) => s.teamId === teamId);
  },
  async recordScan(teamId: string, token: string): Promise<ScanResult> {
    const code = sessionCode();
    if (!code) return { ok: false, reason: "no_team" };
    try {
      const result = await api<ScanResult>("/api/team/scan", {
        method: "POST",
        body: JSON.stringify({ code, token }),
      });
      if (result.ok) void refreshTeamState(code);
      return result;
    } catch {
      return { ok: false, reason: "error" };
    }
  },
  grantLocation(teamId: string, locationId: string): Promise<void> {
    return adminCall("grant", { teamId, locationId });
  },

  /* ---------- answers ---------- */
  teamAnswers(teamId: string): Answer[] {
    return teamCache.answers.filter((a) => a.teamId === teamId);
  },
  async submitSpotDiff(teamId: string, locationId: string, value: string): Promise<SubmitResult> {
    const code = sessionCode();
    if (!code) return { ok: false, message: "Not signed in. Rejoin from the home screen." };
    try {
      const result = await api<SubmitResult>("/api/team/answer", {
        method: "POST",
        body: JSON.stringify({ code, kind: "spotdiff", locationId, value }),
      });
      if (result.ok) void refreshTeamState(code);
      return result;
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },
  async submitBitchat(teamId: string, value: string): Promise<SubmitResult> {
    const code = sessionCode();
    if (!code) return { ok: false, message: "Not signed in. Rejoin from the home screen." };
    try {
      const result = await api<SubmitResult>("/api/team/answer", {
        method: "POST",
        body: JSON.stringify({ code, kind: "bitchat", value }),
      });
      if (result.ok) void refreshTeamState(code);
      return result;
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },
  async submitReconstruction(teamId: string, words: string[]): Promise<SubmitResult> {
    const code = sessionCode();
    if (!code) return { ok: false, message: "Not signed in. Rejoin from the home screen." };
    try {
      const result = await api<SubmitResult>("/api/team/answer", {
        method: "POST",
        body: JSON.stringify({ code, kind: "reconstruction", words }),
      });
      if (result.ok) void refreshTeamState(code);
      return result;
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  /* ---------- collected words (earned only) ---------- */
  collectedWords(teamId: string): Record<string, { word: string; wordClue: string }> {
    if (teamCache.team?.id !== teamId) return {};
    return teamCache.words;
  },

  /* ---------- hints ---------- */
  teamHints(teamId: string): Hint[] {
    return teamCache.hints.filter((h) => h.teamId === teamId);
  },
  pushHint(teamId: string, locationId: string): Promise<void> {
    return adminCall("hint", { teamId, locationId });
  },
  resetTeam(teamId: string): Promise<void> {
    return adminCall("reset-team", { teamId });
  },

  /* ---------- admin ---------- */
  adminAuthed(): boolean {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (stored) adminCode = stored;
    return Boolean(stored);
  },
  async adminLogin(code: string): Promise<{ ok: true } | { ok: false; message: string }> {
    try {
      const res = await api<{ ok: boolean; message?: string }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (!res.ok) return { ok: false, message: res.message ?? "Wrong code. This login is logged." };
      adminCode = code.trim();
      if (typeof window !== "undefined") window.localStorage.setItem(ADMIN_SESSION_KEY, adminCode);
      void refreshAdminState();
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e as Error).message || "Wrong code. This login is logged." };
    }
  },
  adminLogout() {
    if (typeof window !== "undefined") window.localStorage.removeItem(ADMIN_SESSION_KEY);
    adminCode = "";
    adminCache = null;
  },
  snapshot(): DB {
    if (adminCache) return adminCache;
    return {
      game: { ...seedGame(), gateAnswer: [] },
      teams: [],
      scans: [],
      answers: [],
      hints: [],
      broadcasts: [],
      settings: seedSettings(),
      auditLog: [],
    };
  },
  allScans(): Scan[] {
    return adminCache?.scans ?? [];
  },
  allAnswers(): Answer[] {
    return adminCache?.answers ?? [];
  },
  allHints(): Hint[] {
    return adminCache?.hints ?? [];
  },

  /* ---------- broadcasts ---------- */
  broadcasts(): Broadcast[] {
    return teamCache.broadcasts;
  },
  addBroadcast(message: string, audience: Broadcast["audience"], teamId?: string): Promise<void> {
    return adminCall("broadcast", { message, audience, teamId });
  },

  /* ---------- settings ---------- */
  settings(): Settings {
    return teamCache.settings;
  },
  updateSettings(patch: Partial<Settings>): Promise<void> {
    return adminCall("settings", { patch });
  },

  /* ---------- leaderboard + gate lock ---------- */
  leaderboard(): LeaderboardRow[] {
    return teamCache.leaderboard;
  },
  gateLockSeconds(): number {
    return teamCache.gateLockSeconds;
  },

  /* ---------- lifecycle ---------- */
  restartGame(): Promise<void> {
    return adminCall("restart", {});
  },
  newGame(): Promise<void> {
    return adminCall("new", {});
  },
  async exportJSON(): Promise<string> {
    if (!adminCache) {
      await refreshAdminState();
    }
    const db = adminCache;
    if (!db) return "{}";
    return JSON.stringify(
      {
        game: db.game,
        teams: db.teams,
        scans: db.scans,
        answers: db.answers,
        hints: db.hints,
        broadcasts: db.broadcasts,
        settings: db.settings,
        auditLog: db.auditLog ?? [],
      },
      null,
      2,
    );
  },

  /* ---------- polling ---------- */
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    if (typeof window !== "undefined") {
      startPolling();
      const code = sessionCode();
      if (code) void refreshTeamState(code);
    }
    return () => {
      listeners.delete(cb);
    };
  },
};
