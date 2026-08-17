import { seedGame, seedLocations, seedSettings } from "./seed";
import type {
  Answer,
  AnswerKind,
  Broadcast,
  DB,
  GameLocation,
  GameState,
  Hint,
  Scan,
  Settings,
  Team,
} from "./types";
import { accessCode, uid } from "./utils";

/*
 * DEMO MODE STORE (localStorage).
 *
 * This is the single seam where real persistence plugs in. The Supabase adapter
 * (lib/supabase.ts) mirrors these methods against the real backend for
 * multi-device + realtime. Demo mode exists so the entire flow can be built,
 * tested, and demoed on one device before the Supabase project is configured.
 *
 * Data is grouped under one localStorage key so it survives and is easy to wipe:
 *   mh:v1 = { game, teams, scans, answers, hints, broadcasts, settings }
 */

const KEY = "mh:v1";
const SESSION_KEY = "mh:session";
const ADMIN_SESSION_KEY = "mh:admin";
const CHANGE_EVENT = "mh:change";

function emptyDB(): DB {
  return {
    game: seedGame(),
    teams: [],
    scans: [],
    answers: [],
    hints: [],
    broadcasts: [],
    settings: seedSettings(),
  };
}

function readDB(): DB {
  if (typeof window === "undefined") return emptyDB();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyDB();
    const parsed = JSON.parse(raw) as Partial<DB>;
    const base = emptyDB();
    return {
      game: { ...base.game, ...(parsed.game ?? {}) },
      teams: parsed.teams ?? [],
      scans: parsed.scans ?? [],
      answers: parsed.answers ?? [],
      hints: parsed.hints ?? [],
      broadcasts: parsed.broadcasts ?? [],
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return emptyDB();
  }
}

function writeDB(db: DB) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const store = {
  /* ---------- game ---------- */
  game(): GameState {
    return readDB().game;
  },
  setPhase(phase: GameState["phase"]) {
    const db = readDB();
    db.game.phase = phase;
    writeDB(db);
  },
  setWinner(teamId: string | null) {
    const db = readDB();
    db.game.winnerTeamId = teamId;
    writeDB(db);
  },

  /* ---------- locations ---------- */
  locations(): GameLocation[] {
    return seedLocations();
  },
  locationByToken(token: string): GameLocation | undefined {
    return seedLocations().find((l) => l.token === token);
  },

  /* ---------- teams ---------- */
  teams(): Team[] {
    return readDB().teams;
  },
  teamById(id: string): Team | undefined {
    return readDB().teams.find((t) => t.id === id);
  },
  teamByCode(code: string): Team | undefined {
    const clean = code.trim().toUpperCase();
    return readDB().teams.find((t) => t.code === clean);
  },
  createTeam(name: string, member1: string, member2: string): Team {
    const db = readDB();
    let code = accessCode();
    while (db.teams.some((t) => t.code === code)) code = accessCode();
    const team: Team = {
      id: uid("team"),
      name: name.trim(),
      code,
      member1: member1.trim(),
      member2: member2.trim(),
      createdAt: Date.now(),
    };
    db.teams.push(team);
    writeDB(db);
    return team;
  },
  addTeam(name: string, member1: string, member2: string): Team {
    return this.createTeam(name, member1, member2);
  },

  /* ---------- session ---------- */
  sessionTeam(): Team | undefined {
    if (typeof window === "undefined") return undefined;
    const code = window.localStorage.getItem(SESSION_KEY);
    if (!code) return undefined;
    return this.teamByCode(code);
  },
  login(code: string): Team | undefined {
    const team = this.teamByCode(code);
    if (!team) return undefined;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_KEY, team.code);
    }
    return team;
  },
  logout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_KEY);
    }
  },

  /* ---------- scans ---------- */
  teamScans(teamId: string): Scan[] {
    return readDB().scans.filter((s) => s.teamId === teamId);
  },
  recordScan(teamId: string, token: string) {
    const location = this.locationByToken(token);
    const db = readDB();
    if (!location) return { ok: false as const, reason: "unknown" };
    const existing = db.scans.find(
      (s) => s.teamId === teamId && s.locationId === location.id,
    );
    if (existing) return { ok: false as const, reason: "duplicate" };
    db.scans.push({ teamId, locationId: location.id, at: Date.now() });
    writeDB(db);
    return { ok: true as const, location };
  },
  grantLocation(teamId: string, locationId: string) {
    const db = readDB();
    const existing = db.scans.find(
      (s) => s.teamId === teamId && s.locationId === locationId,
    );
    if (existing) return;
    db.scans.push({ teamId, locationId, at: Date.now() });
    writeDB(db);
  },

  /* ---------- answers ---------- */
  teamAnswers(teamId: string): Answer[] {
    return readDB().answers.filter((a) => a.teamId === teamId);
  },
  submitBitchat(teamId: string, value: string): Answer {
    const db = readDB();
    const correct =
      value.trim().toUpperCase() === db.settings.bitchatCode.trim().toUpperCase();
    const answer: Answer = {
      teamId,
      kind: "bitchat",
      value: value.trim(),
      correct,
      at: Date.now(),
    };
    db.answers.push(answer);
    writeDB(db);
    return answer;
  },
  submitReconstruction(teamId: string, words: string[]): Answer {
    const db = readDB();
    const normalized = words.map((w) => w.trim().toUpperCase());
    const correct =
      normalized.length === db.game.gateAnswer.length &&
      normalized.every((w, i) => w === db.game.gateAnswer[i]?.toUpperCase());
    const answer: Answer = {
      teamId,
      kind: "reconstruction",
      value: normalized.join(" "),
      correct,
      at: Date.now(),
    };
    db.answers.push(answer);
    if (correct && !db.game.winnerTeamId) {
      db.game.winnerTeamId = teamId;
    }
    writeDB(db);
    return answer;
  },

  /* ---------- hints (Level 1) ---------- */
  teamHints(teamId: string): Hint[] {
    return readDB().hints.filter((h) => h.teamId === teamId);
  },
  pushHint(teamId: string, locationId: string) {
    const db = readDB();
    const existing = db.hints.find(
      (h) => h.teamId === teamId && h.locationId === locationId,
    );
    if (existing) return;
    db.hints.push({ teamId, locationId, at: Date.now() });
    writeDB(db);
  },
  resetTeam(teamId: string) {
    const db = readDB();
    db.scans = db.scans.filter((s) => s.teamId !== teamId);
    db.answers = db.answers.filter((a) => a.teamId !== teamId);
    db.hints = db.hints.filter((h) => h.teamId !== teamId);
    writeDB(db);
  },

  /* ---------- admin ---------- */
  adminAuthed(): boolean {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ADMIN_SESSION_KEY) === "1";
  },
  adminLogin(code: string): boolean {
    const ok = code.trim() === this.settings().adminCode;
    if (ok && typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_SESSION_KEY, "1");
    }
    return ok;
  },
  adminLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  },
  snapshot(): DB {
    return readDB();
  },
  allScans(): Scan[] {
    return readDB().scans;
  },
  allAnswers(): Answer[] {
    return readDB().answers;
  },
  allHints(): Hint[] {
    return readDB().hints;
  },

  /* ---------- broadcasts ---------- */
  broadcasts(): Broadcast[] {
    return readDB().broadcasts;
  },
  addBroadcast(message: string, audience: Broadcast["audience"], teamId?: string) {
    const db = readDB();
    db.broadcasts.push({
      id: uid("bc"),
      message,
      audience,
      teamId,
      at: Date.now(),
    });
    writeDB(db);
  },

  /* ---------- settings ---------- */
  settings(): Settings {
    return readDB().settings;
  },
  updateSettings(patch: Partial<Settings>) {
    const db = readDB();
    db.settings = { ...db.settings, ...patch };
    writeDB(db);
  },

  /* ---------- lifecycle ---------- */
  restartGame() {
    const db = readDB();
    db.game = seedGame();
    db.scans = [];
    db.answers = [];
    db.hints = [];
    db.broadcasts = [];
    writeDB(db);
  },
  newGame() {
    const db = readDB();
    db.game = seedGame();
    db.teams = [];
    db.scans = [];
    db.answers = [];
    db.hints = [];
    db.broadcasts = [];
    writeDB(db);
  },

  exportJSON(): string {
    return JSON.stringify(readDB(), null, 2);
  },

  /* ---------- realtime-ish ---------- */
  subscribe(cb: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    const onChange = () => cb();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) cb();
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  },
};

export { notify };
