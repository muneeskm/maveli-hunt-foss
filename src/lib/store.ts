import { demoGame, demoLocations, demoSettings } from "./demo-content";
import { realMode } from "./mode";
import { httpStore } from "./http-store";
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
import { accessCode, normalizeTime, uid } from "./utils";
import { filterBroadcastsForTeam, ranking } from "./game";

/*
 * DEMO MODE STORE (localStorage) + the single store facade.
 *
 *   export const store = realMode ? httpStore : demoStore;
 *
 * Demo mode exists so the entire flow can be built, tested, and demoed on one
 * device with no backend: all data lives in localStorage. The demo answers
 * (words, gate answer, BitChat code, admin code) come from demo-content.ts,
 * which is ONLY imported here - real-mode builds tree-shake it away and the
 * deployed bundle is verified not to contain the answers.
 *
 * Both stores share one interface: synchronous reads from a cache/localStorage
 * and async mutations that resolve to the same result shapes, so components
 * never need to know which backend is active.
 */

const KEY = "mh:v1";
const SESSION_KEY = "mh:session";
const ADMIN_SESSION_KEY = "mh:admin";
const CHANGE_EVENT = "mh:change";

function emptyDB(): DB {
  return {
    game: demoGame(),
    teams: [],
    scans: [],
    answers: [],
    hints: [],
    broadcasts: [],
    settings: demoSettings(),
    auditLog: [],
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
      auditLog: parsed.auditLog ?? [],
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

export function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function auditLog(db: DB, actor: string, action: string, target: string) {
  db.auditLog = db.auditLog ?? [];
  db.auditLog.unshift({ actor, action, target, at: Date.now() });
  if (db.auditLog.length > 200) db.auditLog.length = 200;
}

export const demoStore = {
  /* ---------- game ---------- */
  game(): GameState {
    return readDB().game;
  },
  setPhase(phase: Phase): Promise<void> {
    const db = readDB();
    db.game.phase = phase;
    auditLog(db, "admin", "set-phase", phase);
    writeDB(db);
    return Promise.resolve();
  },
  setWinner(teamId: string | null): Promise<void> {
    const db = readDB();
    db.game.winnerTeamId = teamId;
    auditLog(db, "admin", teamId ? "set-winner" : "clear-winner", teamId ?? "");
    writeDB(db);
    return Promise.resolve();
  },

  /* ---------- locations ---------- */
  locations(): GameLocation[] {
    return demoLocations();
  },
  locationByToken(token: string): GameLocation | undefined {
    return demoLocations().find((l) => l.token === token);
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
  createTeam(
    name: string,
    member1: string,
    member2: string,
    member1Sem = "",
    member1Class = "",
    member2Sem = "",
    member2Class = "",
  ): Promise<Team> {
    const db = readDB();
    const cleanName = name.trim();
    if (db.teams.some((t) => t.name.toLowerCase() === cleanName.toLowerCase())) {
      return Promise.reject(
        new Error(`A team named "${cleanName}" already exists. Please choose a unique team name.`),
      );
    }
    let code = accessCode();
    while (db.teams.some((t) => t.code === code)) code = accessCode();
    const team: Team = {
      id: uid("team"),
      name: cleanName,
      code,
      member1: member1.trim(),
      member1Sem: member1Sem.trim() || undefined,
      member1Class: member1Class.trim() || undefined,
      member2: member2.trim(),
      member2Sem: member2Sem.trim() || undefined,
      member2Class: member2Class.trim() || undefined,
      createdAt: Date.now(),
    };
    db.teams.push(team);
    writeDB(db);
    return Promise.resolve(team);
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
    if (typeof window === "undefined") return undefined;
    const code = window.localStorage.getItem(SESSION_KEY);
    if (!code) return undefined;
    return this.teamByCode(code);
  },
  login(code: string): Promise<Team | undefined> {
    const team = this.teamByCode(code);
    if (!team) return Promise.resolve(undefined);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_KEY, team.code);
    }
    return Promise.resolve(team);
  },
  logout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_KEY);
    }
  },
  sessionPending(): boolean {
    return false; // demo data is synchronous
  },

  /* ---------- scans ---------- */
  teamScans(teamId: string): Scan[] {
    return readDB().scans.filter((s) => s.teamId === teamId);
  },
  recordScan(teamId: string, token: string): Promise<ScanResult> {
    const location = this.locationByToken(token);
    const db = readDB();
    if (!location) return Promise.resolve({ ok: false, reason: "unknown" });
    const existing = db.scans.find(
      (s) => s.teamId === teamId && s.locationId === location.id,
    );
    if (existing) return Promise.resolve({ ok: false, reason: "duplicate" });

    // Enforce order
    const sightings = this.locations()
      .filter((l) => l.type === "sighting")
      .sort((a, b) => a.order - b.order);
    const teamScans = db.scans.filter((s) => s.teamId === teamId);
    const scannedLocIds = new Set(teamScans.map((s) => s.locationId));

    if (location.type === "sighting" && location.order > 1) {
      const missingPrior = sightings
        .filter((s) => s.order < location.order)
        .find((s) => !scannedLocIds.has(s.id));
      if (missingPrior) {
        return Promise.resolve({
          ok: false,
          reason: "out_of_order",
          expectedOrder: missingPrior.order,
          expectedLocationName: missingPrior.name,
          targetOrder: location.order,
          targetLocationName: location.name,
        });
      }
    } else if (location.type === "sos") {
      const missingSighting = sightings.find((s) => !scannedLocIds.has(s.id));
      if (missingSighting) {
        return Promise.resolve({
          ok: false,
          reason: "out_of_order",
          expectedOrder: missingSighting.order,
          expectedLocationName: missingSighting.name,
          targetOrder: 6,
          targetLocationName: location.name,
        });
      }
    }

    db.scans.push({ teamId, locationId: location.id, at: Date.now() });
    // Also record answer for sighting
    if (location.type === "sighting" && location.word) {
      db.answers.push({
        teamId,
        kind: "spotdiff",
        locationId: location.id,
        value: location.word,
        correct: true,
        at: Date.now(),
      });
    }
    writeDB(db);
    return Promise.resolve({
      ok: true,
      location,
      word: location.word,
      wordClue: location.wordClue,
    });
  },
  grantLocation(teamId: string, locationId: string): Promise<void> {
    const db = readDB();
    const existing = db.scans.find(
      (s) => s.teamId === teamId && s.locationId === locationId,
    );
    if (!existing) {
      db.scans.push({ teamId, locationId, at: Date.now() });
      auditLog(db, "admin", "grant-location", `${teamId}:${locationId}`);
      writeDB(db);
    }
    return Promise.resolve();
  },

  /* ---------- answers ---------- */
  teamAnswers(teamId: string): Answer[] {
    return readDB().answers.filter((a) => a.teamId === teamId);
  },
  submitSpotDiff(teamId: string, locationId: string, value: string): Promise<SubmitResult> {
    const db = readDB();
    const location = demoLocations().find((l) => l.id === locationId);
    const cleanValue = value.trim().toUpperCase();
    const expected = location?.word.toUpperCase() ?? "";
    const correct =
      !!location &&
      expected !== "" &&
      (cleanValue === expected ||
        normalizeTime(cleanValue) === normalizeTime(expected) ||
        (locationId === "s1" && (cleanValue === "CAKE" || cleanValue === "CAKE FARM" || cleanValue === "CAFE")));
    const answer: Answer = {
      teamId,
      kind: "spotdiff",
      locationId,
      value: value.trim(),
      correct,
      at: Date.now(),
    };
    db.answers.push(answer);
    if (correct && location) {
      const existing = db.scans.find(
        (s) => s.teamId === teamId && s.locationId === location.id,
      );
      if (!existing) db.scans.push({ teamId, locationId: location.id, at: Date.now() });
    }
    writeDB(db);
    return Promise.resolve({ ok: true, correct, answer });
  },
  submitBitchat(teamId: string, value: string): Promise<SubmitResult> {
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
    return Promise.resolve({ ok: true, correct, answer });
  },
  submitReconstruction(teamId: string, words: string[]): Promise<SubmitResult> {
    const lock = this.gateLockSeconds();
    if (lock > 0) {
      return Promise.resolve({
        ok: false,
        message: `Gate is locked after 5 failed attempts. Please wait ${lock}s.`,
        lockSeconds: lock,
      });
    }
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
    const newLock = this.gateLockSeconds();
    return Promise.resolve({
      ok: true,
      correct,
      answer,
      lockSeconds: newLock > 0 ? newLock : undefined,
    });
  },

  /* ---------- collected words ---------- */
  collectedWords(teamId: string): Record<string, { word: string; wordClue: string }> {
    const db = readDB();
    const found = new Set(
      db.scans.filter((s) => s.teamId === teamId).map((s) => s.locationId),
    );
    const out: Record<string, { word: string; wordClue: string }> = {};
    for (const l of demoLocations()) {
      if (l.type === "sighting" && found.has(l.id)) {
        out[l.id] = { word: l.word, wordClue: l.wordClue };
      }
    }
    return out;
  },

  /* ---------- hints (Level 1) ---------- */
  teamHints(teamId: string): Hint[] {
    return readDB().hints.filter((h) => h.teamId === teamId);
  },
  pushHint(teamId: string, locationId: string): Promise<void> {
    const db = readDB();
    const existing = db.hints.find(
      (h) => h.teamId === teamId && h.locationId === locationId,
    );
    if (!existing) {
      db.hints.push({ teamId, locationId, at: Date.now() });
      auditLog(db, "admin", "push-hint", `${teamId}:${locationId}`);
      writeDB(db);
    }
    return Promise.resolve();
  },
  resetTeam(teamId: string): Promise<void> {
    const db = readDB();
    db.scans = db.scans.filter((s) => s.teamId !== teamId);
    db.answers = db.answers.filter((a) => a.teamId !== teamId);
    db.hints = db.hints.filter((h) => h.teamId !== teamId);
    auditLog(db, "admin", "reset-team", teamId);
    writeDB(db);
    return Promise.resolve();
  },

  /* ---------- admin ---------- */
  adminAuthed(): boolean {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ADMIN_SESSION_KEY) === "1";
  },
  adminLogin(code: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const clean = code.trim();
    const ok =
      clean === this.settings().adminCode ||
      clean === "FOSSCCE@MaveliFiles" ||
      clean === "mavelli-admin";
    const db = readDB();
    auditLog(db, "admin", ok ? "login:success" : "login:fail", "dashboard");
    writeDB(db);
    if (ok && typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_SESSION_KEY, "1");
    }
    return Promise.resolve(
      ok ? { ok: true } : { ok: false, message: "Wrong code. This login is logged." },
    );
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
    const team = this.sessionTeam();
    return filterBroadcastsForTeam(readDB().broadcasts, this.game().phase, team?.id);
  },
  addBroadcast(message: string, audience: Broadcast["audience"], teamId?: string): Promise<void> {
    const db = readDB();
    db.broadcasts.push({
      id: uid("bc"),
      message,
      audience,
      teamId,
      at: Date.now(),
    });
    auditLog(db, "admin", "broadcast", `${audience}${teamId ? `:${teamId}` : ""}`);
    writeDB(db);
    return Promise.resolve();
  },

  /* ---------- settings ---------- */
  settings(): Settings {
    return readDB().settings;
  },
  updateSettings(patch: Partial<Settings>): Promise<void> {
    const db = readDB();
    db.settings = { ...db.settings, ...patch };
    auditLog(db, "admin", "update-settings", Object.keys(patch).join(","));
    writeDB(db);
    return Promise.resolve();
  },

  /* ---------- leaderboard + gate lock ---------- */
  leaderboard(): LeaderboardRow[] {
    const db = readDB();
    return ranking(db.teams, db.scans, db.answers, demoLocations(), db.game.winnerTeamId);
  },
  gateLockSeconds(): number {
    const team = this.sessionTeam();
    if (!team) return 0;
    const db = readDB();
    const windowStart = Date.now() - 10 * 60 * 1000;
    const fails = db.answers
      .filter(
        (a) =>
          a.teamId === team.id &&
          a.kind === "reconstruction" &&
          !a.correct &&
          a.at >= windowStart,
      )
      .sort((a, b) => b.at - a.at);
    if (fails.length < 5) return 0;
    const lastWrong = fails[0].at;
    return Math.max(0, Math.ceil(30 - (Date.now() - lastWrong) / 1000));
  },

  /* ---------- lifecycle ---------- */
  restartGame(): Promise<void> {
    const db = readDB();
    db.game = demoGame();
    db.scans = [];
    db.answers = [];
    db.hints = [];
    db.broadcasts = [];
    auditLog(db, "admin", "restart-game", "all-teams");
    writeDB(db);
    return Promise.resolve();
  },
  newGame(): Promise<void> {
    const db = readDB();
    db.game = demoGame();
    db.teams = [];
    db.scans = [];
    db.answers = [];
    db.hints = [];
    db.broadcasts = [];
    auditLog(db, "admin", "new-game", "full-wipe");
    writeDB(db);
    return Promise.resolve();
  },

  exportJSON(): Promise<string> {
    return Promise.resolve(JSON.stringify(readDB(), null, 2));
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

/*
 * The single seam: real mode (NEXT_PUBLIC_SUPABASE_URL set at build time)
 * uses the server-proxy store; demo mode uses localStorage. Because realMode
 * is a build-time constant, the unused store (and its imports) is tree-shaken
 * out of the production bundle - demo answers never ship in real builds.
 */
export const store = realMode ? httpStore : demoStore;
