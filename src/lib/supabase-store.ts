import { seedGame, seedLocations, seedSettings } from "./seed";
import { supabase, supabaseMode } from "./supabase";
import type {
  Answer,
  AnswerKind,
  Broadcast,
  DB,
  GameLocation,
  GameState,
  Hint,
  LocationType,
  Phase,
  Scan,
  Settings,
  Team,
} from "./types";
import { accessCode } from "./utils";

/*
 * SUPABASE-BACKED STORE (real mode).
 *
 * A 1:1 mirror of the demo store (lib/store.ts) so the whole app works
 * unchanged: same method names, same synchronous return shapes. The app
 * switches to this implementation automatically when
 * NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set
 * (see lib/store.ts facade and .env.example).
 *
 * HOW IT WORKS
 *   - An in-memory cache holds the full DB shape; the UI reads it
 *     synchronously, exactly like localStorage in demo mode.
 *   - The cache is loaded from Supabase once, then kept fresh by realtime
 *     subscriptions (scans, answers, hints, broadcasts, teams, games,
 *     settings) - zero polling.
 *   - Every mutation updates the cache optimistically (UI stays instant)
 *     and fires the async write; server constraints (unique team/location
 *     scans, first-winner-wins) reconcile via the conditional updates below
 *     and a refetch, so racing phones cannot double-award.
 *   - Admin interventions (phase, winner, reset, grant, lifecycle) are
 *     appended to public.audit_log (schema.db).
 *
 * If Supabase is not configured this module is inert: the facade falls back
 * to the demo store and none of these functions run.
 */

/* ---------- row types ---------- */

type TeamRow = {
  id: string;
  name: string;
  code: string;
  member1: string;
  member2: string;
  created_at: string;
};
type ScanRow = { team_id: string; location_id: string; at: string };
type AnswerRow = {
  team_id: string;
  kind: AnswerKind;
  location_id: string | null;
  value: string;
  correct: boolean;
  at: string;
};
type HintRow = { team_id: string; location_id: string; at: string };
type BroadcastRow = {
  id: string;
  message: string;
  audience: string;
  team_id: string | null;
  at: string;
};
type SettingsRow = {
  volunteer_phone: string;
  volunteer_whatsapp: string;
  instagram_url: string;
  bitchat_guide: string;
  bitchat_code: string;
  admin_code: string;
  sos_lock_seconds: number;
  mapillary_note: string;
};
type GameRow = {
  id: string;
  phase: Phase;
  winner_team_id: string | null;
  gate_answer: string[] | null;
  gate_slots: string[] | null;
  started_at: string;
};
type LocationRow = {
  id: string;
  ord: number;
  type: LocationType;
  name: string;
  token: string;
  word: string;
  word_clue: string;
  photo_url: string;
  mapillary_url: string;
  clue_text: string;
  hint_text: string;
  mapillary_note: string | null;
};

/* ---------- state ---------- */

const SESSION_KEY = "mh:session";
const ADMIN_SESSION_KEY = "mh:admin";

let cache: DB = emptyState();
let gameRowId: string | null = null;
let locationsCache: GameLocation[] | null = null;
let loadPromise: Promise<void> | null = null;
let realtimeStarted = false;
const listeners = new Set<() => void>();

function emptyState(): DB {
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

function notify() {
  listeners.forEach((cb) => cb());
}

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // fallback for older contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

/* ---------- row <-> domain mappers ---------- */

function teamFromRow(r: TeamRow): Team {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    member1: r.member1,
    member2: r.member2,
    createdAt: Date.parse(r.created_at),
  };
}
function scanFromRow(r: ScanRow): Scan {
  return { teamId: r.team_id, locationId: r.location_id, at: Date.parse(r.at) };
}
function answerFromRow(r: AnswerRow): Answer {
  return {
    teamId: r.team_id,
    kind: r.kind,
    locationId: r.location_id ?? undefined,
    value: r.value,
    correct: r.correct,
    at: Date.parse(r.at),
  };
}
function hintFromRow(r: HintRow): Hint {
  return { teamId: r.team_id, locationId: r.location_id, at: Date.parse(r.at) };
}
function broadcastFromRow(r: BroadcastRow): Broadcast {
  return {
    id: r.id,
    message: r.message,
    audience: r.audience as Broadcast["audience"],
    teamId: r.team_id ?? undefined,
    at: Date.parse(r.at),
  };
}
function settingsFromRow(r: SettingsRow): Settings {
  return {
    volunteerPhone: r.volunteer_phone,
    volunteerWhatsapp: r.volunteer_whatsapp,
    instagramUrl: r.instagram_url,
    bitchatGuide: r.bitchat_guide,
    bitchatCode: r.bitchat_code,
    adminCode: r.admin_code,
    sosLockSeconds: r.sos_lock_seconds,
    mapillaryNote: r.mapillary_note,
  };
}
function gameFromRow(r: GameRow): GameState {
  return {
    phase: r.phase,
    winnerTeamId: r.winner_team_id,
    gateAnswer: r.gate_answer ?? [],
    gateSlots: r.gate_slots ?? [],
    startedAt: Date.parse(r.started_at),
  };
}
function locationFromRow(r: LocationRow): GameLocation {
  return {
    id: r.id,
    order: r.ord,
    type: r.type,
    name: r.name,
    token: r.token,
    word: r.word,
    wordClue: r.word_clue,
    photoUrl: r.photo_url,
    mapillaryUrl: r.mapillary_url,
    clueText: r.clue_text,
    hintText: r.hint_text,
    mapillaryNote: r.mapillary_note ?? undefined,
  };
}

/* ---------- load + refetch ---------- */

type Table =
  | "teams"
  | "scans"
  | "answers"
  | "hints"
  | "broadcasts"
  | "locations"
  | "game"
  | "settings";

async function fetchRows(table: Table): Promise<unknown> {
  if (!supabase) return null;
  if (table === "teams") {
    const { data, error } = await supabase
      .from("teams")
      .select("id,name,code,member1,member2,created_at");
    if (error) throw error;
    return (data ?? []).map((r) => teamFromRow(r as TeamRow));
  }
  if (table === "scans") {
    const { data, error } = await supabase
      .from("scans")
      .select("team_id,location_id,at");
    if (error) throw error;
    return (data ?? []).map((r) => scanFromRow(r as ScanRow));
  }
  if (table === "answers") {
    const { data, error } = await supabase
      .from("answers")
      .select("team_id,kind,location_id,value,correct,at");
    if (error) throw error;
    return (data ?? []).map((r) => answerFromRow(r as AnswerRow));
  }
  if (table === "hints") {
    const { data, error } = await supabase
      .from("hints")
      .select("team_id,location_id,at");
    if (error) throw error;
    return (data ?? []).map((r) => hintFromRow(r as HintRow));
  }
  if (table === "broadcasts") {
    const { data, error } = await supabase
      .from("broadcasts")
      .select("id,message,audience,team_id,at");
    if (error) throw error;
    return (data ?? []).map((r) => broadcastFromRow(r as BroadcastRow));
  }
  if (table === "locations") {
    const { data, error } = await supabase
      .from("locations")
      .select(
        "id,ord,type,name,token,word,word_clue,photo_url,mapillary_url,clue_text,hint_text,mapillary_note",
      )
      .order("ord");
    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) return null; // seed.sql not run yet -> fall back to seed
    return rows.map((r) => locationFromRow(r as LocationRow));
  }
  if (table === "game") {
    const { data, error } = await supabase
      .from("games")
      .select("id,phase,winner_team_id,gate_answer,gate_slots,started_at")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as GameRow | null) ?? null;
  }
  if (table === "settings") {
    const { data, error } = await supabase
      .from("settings")
      .select(
        "volunteer_phone,volunteer_whatsapp,instagram_url,bitchat_guide,bitchat_code,admin_code,sos_lock_seconds,mapillary_note",
      )
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    return (data as SettingsRow | null) ?? null;
  }
  return null;
}

async function refetch(table: keyof DB | "game" | "locations") {
  try {
    if (table === "game") {
      const row = (await fetchRows("game")) as GameRow | null;
      if (row) {
        gameRowId = row.id;
        cache.game = gameFromRow(row);
      }
    } else if (table === "settings") {
      const row = (await fetchRows("settings")) as SettingsRow | null;
      if (row) cache.settings = settingsFromRow(row);
    } else if (table === "locations") {
      const rows = (await fetchRows("locations")) as GameLocation[] | null;
      if (rows) locationsCache = rows;
    } else {
      const rows = await fetchRows(table);
      cache[table] = rows as never;
    }
    notify();
  } catch (e) {
    console.error(`refetch ${table}`, e);
  }
}

async function bootstrap() {
  if (!supabase) return;
  // games row (seed.sql may not have been run yet)
  let gameRow = (await fetchRows("game")) as GameRow | null;
  if (!gameRow) {
    const g = seedGame();
    const { data, error } = await supabase
      .from("games")
      .insert({
        phase: g.phase,
        winner_team_id: null,
        gate_answer: g.gateAnswer,
        gate_slots: g.gateSlots,
      })
      .select("id")
      .single();
    if (error) {
      // concurrent bootstrap from another phone - just re-read
      gameRow = (await fetchRows("game")) as GameRow | null;
    } else if (data) {
      gameRow = data as GameRow;
    }
  }
  if (gameRow) {
    gameRowId = gameRow.id;
    cache.game = gameFromRow(gameRow);
  }
  // settings row
  const settingsRow = (await fetchRows("settings")) as SettingsRow | null;
  if (settingsRow) {
    cache.settings = settingsFromRow(settingsRow);
  } else {
    const s = seedSettings();
    const { error } = await supabase.from("settings").insert({
      id: 1,
      volunteer_phone: s.volunteerPhone,
      volunteer_whatsapp: s.volunteerWhatsapp,
      instagram_url: s.instagramUrl,
      bitchat_guide: s.bitchatGuide,
      bitchat_code: s.bitchatCode,
      admin_code: s.adminCode,
      sos_lock_seconds: s.sosLockSeconds,
      mapillary_note: s.mapillaryNote,
    });
    if (!error) cache.settings = s;
  }
}

async function loadAll() {
  if (!supabase) return;
  try {
    await bootstrap();
    const [teams, scans, answers, hints, broadcasts, locs] = await Promise.all([
      fetchRows("teams"),
      fetchRows("scans"),
      fetchRows("answers"),
      fetchRows("hints"),
      fetchRows("broadcasts"),
      fetchRows("locations"),
    ]);
    cache.teams = teams as Team[];
    cache.scans = scans as Scan[];
    cache.answers = answers as Answer[];
    cache.hints = hints as Hint[];
    cache.broadcasts = broadcasts as Broadcast[];
    if (locs) locationsCache = locs as GameLocation[];
    notify();
  } catch (e) {
    console.error("supabase loadAll", e);
  }
}

function ensureLoaded(): Promise<void> {
  if (!loadPromise) loadPromise = loadAll();
  return loadPromise;
}

/* ---------- realtime ---------- */

function setupRealtime() {
  if (!supabase || realtimeStarted) return;
  realtimeStarted = true;
  const channel = supabase.channel("mavelli-db");
  const tables = ["teams", "scans", "answers", "hints", "broadcasts"] as const;
  for (const t of tables) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: t },
      () => void refetch(t),
    );
  }
  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "games" },
    () => void refetch("game"),
  );
  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "settings" },
    () => void refetch("settings"),
  );
  channel.subscribe();
}

/* ---------- audit ---------- */

function audit(actor: string, action: string, target: string) {
  if (!supabase) return;
  void supabase
    .from("audit_log")
    .insert({ actor, action, target })
    .then(({ error }) => {
      if (error) console.error("audit", error);
    });
}

/* ---------- shared helpers ---------- */

function genCode(): string {
  let code = accessCode();
  while (cache.teams.some((t) => t.code === code)) code = accessCode();
  return code;
}

async function writeScans(teamId: string, locationId: string) {
  if (!supabase) return;
  // upsert + ignoreDuplicates: first scan per team/location wins, enforced
  // server-side by the unique(team_id, location_id) constraint
  const { error } = await supabase
    .from("scans")
    .upsert(
      { team_id: teamId, location_id: locationId, at: nowIso() },
      { onConflict: "team_id,location_id", ignoreDuplicates: true },
    );
  if (error) console.error("writeScan", error);
  void refetch("scans");
}

async function writeAnswer(answer: Answer) {
  if (!supabase) return;
  const { error } = await supabase
    .from("answers")
    .insert({
      team_id: answer.teamId,
      kind: answer.kind,
      location_id: answer.locationId ?? null,
      value: answer.value,
      correct: answer.correct,
      at: nowIso(),
    });
  if (error) {
    console.error("writeAnswer", error);
    void refetch("answers");
  }
}

/* ---------- the store ---------- */

export const supabaseStore = {
  /* ---------- game ---------- */
  game(): GameState {
    return cache.game;
  },
  setPhase(phase: Phase) {
    cache.game.phase = phase;
    notify();
    if (supabase && gameRowId) {
      void supabase
        .from("games")
        .update({ phase })
        .eq("id", gameRowId)
        .then(({ error }) => {
          if (error) console.error("setPhase", error);
        });
      audit("admin", "set-phase", phase);
    }
  },
  setWinner(teamId: string | null) {
    cache.game.winnerTeamId = teamId;
    notify();
    if (supabase && gameRowId) {
      void supabase
        .from("games")
        .update({ winner_team_id: teamId })
        .eq("id", gameRowId)
        .then(({ error }) => {
          if (error) console.error("setWinner", error);
        });
      audit("admin", teamId ? "set-winner" : "clear-winner", teamId ?? "");
    }
  },

  /* ---------- locations ---------- */
  locations(): GameLocation[] {
    return locationsCache ?? seedLocations();
  },
  locationByToken(token: string): GameLocation | undefined {
    return this.locations().find((l) => l.token === token);
  },

  /* ---------- teams ---------- */
  teams(): Team[] {
    return cache.teams;
  },
  teamById(id: string): Team | undefined {
    return cache.teams.find((t) => t.id === id);
  },
  teamByCode(code: string): Team | undefined {
    const clean = code.trim().toUpperCase();
    return cache.teams.find((t) => t.code === clean);
  },
  createTeam(name: string, member1: string, member2: string): Team {
    const team: Team = {
      id: uuid(),
      name: name.trim(),
      code: genCode(),
      member1: member1.trim(),
      member2: member2.trim(),
      createdAt: Date.now(),
    };
    cache.teams.push(team);
    notify();
    if (supabase) {
      void supabase
        .from("teams")
        .insert({
          id: team.id,
          name: team.name,
          code: team.code,
          member1: team.member1,
          member2: team.member2,
          created_at: nowIso(),
        })
        .then(({ error }) => {
          if (error) {
            console.error("createTeam", error);
            void refetch("teams"); // e.g. code collision -> reconcile
          }
        });
    }
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
    return cache.scans.filter((s) => s.teamId === teamId);
  },
  recordScan(teamId: string, token: string) {
    const location = this.locationByToken(token);
    if (!location) return { ok: false as const, reason: "unknown" };
    const existing = cache.scans.some(
      (s) => s.teamId === teamId && s.locationId === location.id,
    );
    if (existing) return { ok: false as const, reason: "duplicate" };
    cache.scans.push({ teamId, locationId: location.id, at: Date.now() });
    notify();
    void writeScans(teamId, location.id);
    return { ok: true as const, location };
  },
  grantLocation(teamId: string, locationId: string) {
    if (cache.scans.some((s) => s.teamId === teamId && s.locationId === locationId))
      return;
    cache.scans.push({ teamId, locationId, at: Date.now() });
    notify();
    void writeScans(teamId, locationId);
    audit("admin", "grant-location", `${teamId}:${locationId}`);
  },

  /* ---------- answers ---------- */
  teamAnswers(teamId: string): Answer[] {
    return cache.answers.filter((a) => a.teamId === teamId);
  },
  submitSpotDiff(teamId: string, locationId: string, value: string): Answer {
    const location = this.locations().find((l) => l.id === locationId);
    const correct =
      !!location &&
      location.word !== "" &&
      value.trim().toUpperCase() === location.word.toUpperCase();
    const answer: Answer = {
      teamId,
      kind: "spotdiff",
      locationId,
      value: value.trim(),
      correct,
      at: Date.now(),
    };
    cache.answers.push(answer);
    if (correct && location) {
      const existing = cache.scans.some(
        (s) => s.teamId === teamId && s.locationId === location.id,
      );
      if (!existing) {
        cache.scans.push({ teamId, locationId: location.id, at: Date.now() });
      }
    }
    notify();
    if (supabase) {
      void (async () => {
        await writeAnswer(answer);
        if (correct && location) await writeScans(teamId, location.id);
      })();
    }
    return answer;
  },
  submitBitchat(teamId: string, value: string): Answer {
    const correct =
      value.trim().toUpperCase() === cache.settings.bitchatCode.trim().toUpperCase();
    const answer: Answer = {
      teamId,
      kind: "bitchat",
      value: value.trim(),
      correct,
      at: Date.now(),
    };
    cache.answers.push(answer);
    notify();
    void writeAnswer(answer);
    return answer;
  },
  submitReconstruction(teamId: string, words: string[]): Answer {
    const normalized = words.map((w) => w.trim().toUpperCase());
    const correct =
      normalized.length === cache.game.gateAnswer.length &&
      normalized.every((w, i) => w === cache.game.gateAnswer[i]?.toUpperCase());
    const answer: Answer = {
      teamId,
      kind: "reconstruction",
      value: normalized.join(" "),
      correct,
      at: Date.now(),
    };
    cache.answers.push(answer);
    if (correct && !cache.game.winnerTeamId) {
      cache.game.winnerTeamId = teamId;
    }
    notify();
    if (supabase) {
      void (async () => {
        await writeAnswer(answer);
        if (correct && gameRowId) {
          // first-come-first-served: only wins if no winner is set yet
          const { error } = await supabase
            .from("games")
            .update({ winner_team_id: teamId })
            .eq("id", gameRowId)
            .is("winner_team_id", null);
          if (error) console.error("submitReconstruction winner", error);
          void refetch("game");
        }
      })();
    }
    return answer;
  },

  /* ---------- hints (Level 1) ---------- */
  teamHints(teamId: string): Hint[] {
    return cache.hints.filter((h) => h.teamId === teamId);
  },
  pushHint(teamId: string, locationId: string) {
    if (cache.hints.some((h) => h.teamId === teamId && h.locationId === locationId))
      return;
    cache.hints.push({ teamId, locationId, at: Date.now() });
    notify();
    if (supabase) {
      void supabase
        .from("hints")
        .insert({ team_id: teamId, location_id: locationId, at: nowIso() })
        .then(({ error }) => {
          if (error) console.error("pushHint", error);
        });
    }
  },
  resetTeam(teamId: string) {
    cache.scans = cache.scans.filter((s) => s.teamId !== teamId);
    cache.answers = cache.answers.filter((a) => a.teamId !== teamId);
    cache.hints = cache.hints.filter((h) => h.teamId !== teamId);
    notify();
    if (supabase) {
      void Promise.all([
        supabase.from("scans").delete().eq("team_id", teamId),
        supabase.from("answers").delete().eq("team_id", teamId),
        supabase.from("hints").delete().eq("team_id", teamId),
      ]).then(() => {
        void refetch("scans");
        void refetch("answers");
        void refetch("hints");
      });
      audit("admin", "reset-team", teamId);
    }
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
    return cache;
  },
  allScans(): Scan[] {
    return cache.scans;
  },
  allAnswers(): Answer[] {
    return cache.answers;
  },
  allHints(): Hint[] {
    return cache.hints;
  },

  /* ---------- broadcasts ---------- */
  broadcasts(): Broadcast[] {
    return cache.broadcasts;
  },
  addBroadcast(message: string, audience: Broadcast["audience"], teamId?: string) {
    const broadcast: Broadcast = {
      id: uuid(),
      message,
      audience,
      teamId,
      at: Date.now(),
    };
    cache.broadcasts.push(broadcast);
    notify();
    if (supabase) {
      void supabase
        .from("broadcasts")
        .insert({
          id: broadcast.id,
          message,
          audience,
          team_id: teamId ?? null,
          at: nowIso(),
        })
        .then(({ error }) => {
          if (error) console.error("addBroadcast", error);
        });
    }
  },

  /* ---------- settings ---------- */
  settings(): Settings {
    return cache.settings;
  },
  updateSettings(patch: Partial<Settings>) {
    cache.settings = { ...cache.settings, ...patch };
    notify();
    if (supabase) {
      const row: Partial<Record<string, unknown>> = {};
      if (patch.volunteerPhone !== undefined) row.volunteer_phone = patch.volunteerPhone;
      if (patch.volunteerWhatsapp !== undefined) row.volunteer_whatsapp = patch.volunteerWhatsapp;
      if (patch.instagramUrl !== undefined) row.instagram_url = patch.instagramUrl;
      if (patch.bitchatGuide !== undefined) row.bitchat_guide = patch.bitchatGuide;
      if (patch.bitchatCode !== undefined) row.bitchat_code = patch.bitchatCode;
      if (patch.adminCode !== undefined) row.admin_code = patch.adminCode;
      if (patch.sosLockSeconds !== undefined) row.sos_lock_seconds = patch.sosLockSeconds;
      if (patch.mapillaryNote !== undefined) row.mapillary_note = patch.mapillaryNote;
      void supabase
        .from("settings")
        .update(row)
        .eq("id", 1)
        .then(({ error }) => {
          if (error) console.error("updateSettings", error);
        });
    }
  },

  /* ---------- lifecycle ---------- */
  restartGame() {
    cache.game = { ...seedGame(), startedAt: Date.now() };
    cache.scans = [];
    cache.answers = [];
    cache.hints = [];
    cache.broadcasts = [];
    notify();
    if (supabase) {
      void (async () => {
        await Promise.all([
          supabase.from("scans").delete().neq("team_id", ""),
          supabase.from("answers").delete().neq("team_id", ""),
          supabase.from("hints").delete().neq("team_id", ""),
          supabase.from("broadcasts").delete().neq("id", ""),
        ]);
        if (gameRowId) {
          await supabase
            .from("games")
            .update({ phase: "setup", winner_team_id: null })
            .eq("id", gameRowId);
        }
        void refetch("game");
      })();
      audit("admin", "restart-game", "");
    }
  },
  newGame() {
    cache.game = { ...seedGame(), startedAt: Date.now() };
    cache.teams = [];
    cache.scans = [];
    cache.answers = [];
    cache.hints = [];
    cache.broadcasts = [];
    notify();
    if (supabase) {
      void (async () => {
        await Promise.all([
          supabase.from("scans").delete().neq("team_id", ""),
          supabase.from("answers").delete().neq("team_id", ""),
          supabase.from("hints").delete().neq("team_id", ""),
          supabase.from("broadcasts").delete().neq("id", ""),
          supabase.from("teams").delete().neq("id", ""),
        ]);
        if (gameRowId) {
          await supabase
            .from("games")
            .update({ phase: "setup", winner_team_id: null })
            .eq("id", gameRowId);
        }
        void refetch("game");
      })();
      audit("admin", "new-game", "");
    }
  },

  exportJSON(): string {
    return JSON.stringify(cache, null, 2);
  },

  /* ---------- realtime-ish ---------- */
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    void ensureLoaded();
    setupRealtime();
    return () => {
      listeners.delete(cb);
    };
  },
};

// Eager load so the first render already has data (only in real mode)
if (supabaseMode && typeof window !== "undefined") {
  void ensureLoaded();
}
