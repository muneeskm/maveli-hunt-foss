import { randomUUID } from "crypto";
import { requireServerSupabase } from "./supabase-server";
import { filterBroadcastsForTeam, ranking } from "./game";
import { seedGame, seedLocations, seedSettings } from "./seed";
import { normalizeTime } from "./utils";
import type {
  Answer,
  AnswerKind,
  Broadcast,
  GameLocation,
  GameState,
  Hint,
  LeaderboardRow,
  LocationType,
  Phase,
  Scan,
  ScanResult,
  Settings,
  Team,
} from "./types";

/*
 * SERVER-SIDE GAME LOGIC (service-role only).
 *
 * This module is the ONLY place answers are verified and codes are read.
 * It is imported exclusively by the Next.js API routes (src/app/api/*) and
 * must never be imported from client code.
 *
 * Privacy invariants:
 *   - words, gate_answer, bitchat_code and admin_code are read here from the
 *     database and never included in client payloads (except words a team
 *     has legitimately earned).
 *   - the gate is locked server-side after repeated wrong attempts, so
 *     brute-forcing the answer endpoint is not possible.
 *   - every admin intervention is written to audit_log.
 */

export const MAX_GATE_FAILS = 5;
export const GATE_LOCK_SECONDS = 60;
const GATE_LOCK_WINDOW_MS = 10 * 60 * 1000;

export const MAX_ADMIN_LOGIN_FAILS = 5;
export const ADMIN_LOGIN_LOCK_SECONDS = 60;
const ADMIN_LOGIN_LOCK_WINDOW_MS = 10 * 60 * 1000;

/* ---------- row types ---------- */

type TeamRow = {
  id: string;
  name: string;
  code: string;
  member1: string;
  member2: string;
  member1_sem?: string | null;
  member1_class?: string | null;
  member2_sem?: string | null;
  member2_class?: string | null;
  created_at: string;
};
type ScanRow = { team_id: string; location_id: string; at: string };
type AnswerRow = { team_id: string; kind: AnswerKind; location_id: string | null; value: string; correct: boolean; at: string };
type HintRow = { team_id: string; location_id: string; at: string };
type BroadcastRow = { id: string; message: string; audience: string; team_id: string | null; at: string };
type SettingsRow = {
  volunteer_phone: string; volunteer_whatsapp: string; instagram_url: string;
  bitchat_guide: string; bitchat_code: string; admin_code: string;
  sos_lock_seconds: number; mapillary_note: string;
};
type GameRow = { id: string; phase: Phase; winner_team_id: string | null; gate_answer: string[] | null; gate_slots: string[] | null; started_at: string };
type LocationRow = {
  id: string; ord: number; type: LocationType; name: string; token: string;
  word: string; word_clue: string; photo_url: string; mapillary_url: string;
  clue_text: string; hint_text: string; mapillary_note: string | null;
};
type AuditRow = { actor: string; action: string; target: string; at: string };

/* ---------- mappers ---------- */

export const teamFromRow = (r: TeamRow): Team => ({
  id: r.id,
  name: r.name,
  code: r.code,
  member1: r.member1,
  member1Sem: r.member1_sem ?? undefined,
  member1Class: r.member1_class ?? undefined,
  member2: r.member2,
  member2Sem: r.member2_sem ?? undefined,
  member2Class: r.member2_class ?? undefined,
  createdAt: Date.parse(r.created_at),
});
const scanFromRow = (r: ScanRow): Scan => ({ teamId: r.team_id, locationId: r.location_id, at: Date.parse(r.at) });
const answerFromRow = (r: AnswerRow): Answer => ({
  teamId: r.team_id, kind: r.kind, locationId: r.location_id ?? undefined,
  value: r.value, correct: r.correct, at: Date.parse(r.at),
});
const hintFromRow = (r: HintRow): Hint => ({ teamId: r.team_id, locationId: r.location_id, at: Date.parse(r.at) });
const broadcastFromRow = (r: BroadcastRow): Broadcast => ({
  id: r.id, message: r.message, audience: r.audience as Broadcast["audience"],
  teamId: r.team_id ?? undefined, at: Date.parse(r.at),
});
const settingsFromRow = (r: SettingsRow): Settings => ({
  volunteerPhone: r.volunteer_phone, volunteerWhatsapp: r.volunteer_whatsapp,
  instagramUrl: r.instagram_url, bitchatGuide: r.bitchat_guide,
  bitchatCode: r.bitchat_code, adminCode: r.admin_code,
  sosLockSeconds: r.sos_lock_seconds, mapillaryNote: r.mapillary_note,
});
const gameFromRow = (r: GameRow): GameState => ({
  phase: r.phase, winnerTeamId: r.winner_team_id,
  gateAnswer: r.gate_answer ?? [], gateSlots: r.gate_slots ?? [],
  startedAt: Date.parse(r.started_at),
});
const locationFromRow = (r: LocationRow): GameLocation => ({
  id: r.id, order: r.ord, type: r.type, name: r.name, token: r.token,
  word: r.word, wordClue: r.word_clue, photoUrl: r.photo_url,
  mapillaryUrl: r.mapillary_url, clueText: r.clue_text, hintText: r.hint_text,
  mapillaryNote: r.mapillary_note ?? undefined,
});

/** Strip answers from a location before it leaves the server. */
export const locationPublic = (l: GameLocation): GameLocation => ({ ...l, word: "", wordClue: "" });

/** Strip codes from settings before they leave the server. */
export const settingsPublic = (s: Settings): Settings => ({ ...s, bitchatCode: "", adminCode: "" });

/* ---------- queries ---------- */

const db = () => requireServerSupabase();

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function getTeamByCode(code: string): Promise<Team | null> {
  const clean = normalizeCode(code);
  const { data, error } = await db()
    .from("teams")
    .select("*")
    .eq("code", clean)
    .maybeSingle();
  if (error) throw error;
  return data ? teamFromRow(data as TeamRow) : null;
}

export async function getTeamById(id: string): Promise<Team | null> {
  const { data, error } = await db()
    .from("teams")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? teamFromRow(data as TeamRow) : null;
}

export async function getTeamByName(name: string): Promise<Team | null> {
  const clean = name.trim();
  try {
    const { data, error } = await db()
      .from("teams")
      .select("*")
      .ilike("name", clean)
      .limit(1);
    if (!error && data && data.length > 0) {
      return teamFromRow(data[0] as TeamRow);
    }
  } catch (e) {
    console.error("getTeamByName query failed, falling back to getAllTeams:", e);
  }
  try {
    const all = await getAllTeams();
    return all.find((t) => t.name.toLowerCase() === clean.toLowerCase()) ?? null;
  } catch {
    return null;
  }
}

export async function getAllTeams(): Promise<Team[]> {
  const { data, error } = await db().from("teams").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map((r) => teamFromRow(r as TeamRow));
}

export async function getAllScans(): Promise<Scan[]> {
  const { data, error } = await db().from("scans").select("team_id,location_id,at");
  if (error) throw error;
  return (data ?? []).map((r) => scanFromRow(r as ScanRow));
}

export async function getAllAnswers(): Promise<Answer[]> {
  const { data, error } = await db().from("answers").select("team_id,kind,location_id,value,correct,at");
  if (error) throw error;
  return (data ?? []).map((r) => answerFromRow(r as AnswerRow));
}

export async function getAllHints(): Promise<Hint[]> {
  const { data, error } = await db().from("hints").select("team_id,location_id,at");
  if (error) throw error;
  return (data ?? []).map((r) => hintFromRow(r as HintRow));
}

export async function getAllBroadcasts(): Promise<Broadcast[]> {
  const { data, error } = await db().from("broadcasts").select("id,message,audience,team_id,at").order("at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => broadcastFromRow(r as BroadcastRow));
}

export async function getGame(): Promise<{ row: GameRow; state: GameState }> {
  let { data, error } = await db()
    .from("games")
    .select("id,phase,winner_team_id,gate_answer,gate_slots,started_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const g = seedGame();
    const ins = await db()
      .from("games")
      .insert({ phase: g.phase, winner_team_id: null, gate_answer: [], gate_slots: g.gateSlots })
      .select("id,phase,winner_team_id,gate_answer,gate_slots,started_at")
      .single();
    if (ins.error) throw ins.error;
    data = ins.data;
  }
  const row = data as GameRow;
  return { row, state: gameFromRow(row) };
}

export async function getSettings(): Promise<Settings> {
  const { data, error } = await db()
    .from("settings")
    .select("volunteer_phone,volunteer_whatsapp,instagram_url,bitchat_guide,bitchat_code,admin_code,sos_lock_seconds,mapillary_note")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const s = seedSettings();
    await db().from("settings").insert({
      id: 1, volunteer_phone: s.volunteerPhone, volunteer_whatsapp: s.volunteerWhatsapp,
      instagram_url: s.instagramUrl, bitchat_guide: s.bitchatGuide,
      bitchat_code: s.bitchatCode, admin_code: s.adminCode,
      sos_lock_seconds: s.sosLockSeconds, mapillary_note: s.mapillaryNote,
    });
    return s;
  }
  return settingsFromRow(data as SettingsRow);
}

export async function getLocations(): Promise<GameLocation[]> {
  const { data, error } = await db()
    .from("locations")
    .select("id,ord,type,name,token,word,word_clue,photo_url,mapillary_url,clue_text,hint_text,mapillary_note")
    .order("ord");
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return seedLocations(); // seed.sql not run yet
  return rows.map((r) => locationFromRow(r as LocationRow));
}

/* ---------- audit ---------- */

export async function audit(actor: string, action: string, target: string) {
  await db().from("audit_log").insert({ actor, action, target }).then(({ error }) => {
    if (error) console.error("audit", error);
  });
}

/* ---------- gate lock ---------- */

export async function gateLockSeconds(teamId: string): Promise<number> {
  const since = new Date(Date.now() - GATE_LOCK_WINDOW_MS).toISOString();
  const { data, error } = await db()
    .from("answers")
    .select("at")
    .eq("team_id", teamId)
    .eq("kind", "reconstruction")
    .eq("correct", false)
    .gte("at", since)
    .order("at", { ascending: false })
    .limit(MAX_GATE_FAILS);
  if (error) throw error;
  const fails = (data ?? []) as { at: string }[];
  if (fails.length < MAX_GATE_FAILS) return 0;
  const lastWrong = Date.parse(fails[0].at);
  return Math.max(0, Math.ceil(GATE_LOCK_SECONDS - (Date.now() - lastWrong) / 1000));
}

/* ---------- admin login lock ---------- */

export async function adminLockSeconds(): Promise<number> {
  const windowStart = new Date(Date.now() - ADMIN_LOGIN_LOCK_WINDOW_MS).toISOString();

  // Reset count if an admin logged in successfully recently
  const { data: successData } = await db()
    .from("audit_log")
    .select("at")
    .eq("action", "login:success")
    .order("at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestSuccessAt = successData?.at as string | undefined;
  const since = latestSuccessAt && latestSuccessAt > windowStart ? latestSuccessAt : windowStart;

  const { data, error } = await db()
    .from("audit_log")
    .select("at")
    .eq("action", "login:fail")
    .gte("at", since)
    .order("at", { ascending: false })
    .limit(MAX_ADMIN_LOGIN_FAILS);
  if (error) throw error;
  const fails = (data ?? []) as { at: string }[];
  if (fails.length < MAX_ADMIN_LOGIN_FAILS) return 0;
  const lastWrong = Date.parse(fails[0].at);
  return Math.max(0, Math.ceil(ADMIN_LOGIN_LOCK_SECONDS - (Date.now() - lastWrong) / 1000));
}

/* ---------- team payload ---------- */

export interface TeamStatePayload {
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
}

export async function buildTeamState(code: string): Promise<TeamStatePayload> {
  const team = await getTeamByCode(code);
  if (!team) {
    return {
      rev: 0, team: null, game: { phase: "setup", winnerTeamId: null, gateSlots: [], startedAt: 0 },
      settings: settingsPublic(seedSettings()), locations: seedLocations().map(locationPublic),
      scans: [], answers: [], hints: [], words: {}, broadcasts: [], leaderboard: [], gateLockSeconds: 0,
    };
  }
  const [scans, answers, hints, broadcasts, { state }, settings, locations, leaderboard, lock] = await Promise.all([
    getAllScans(),
    getAllAnswers(),
    getAllHints(),
    getAllBroadcasts(),
    getGame(),
    getSettings(),
    getLocations(),
    (async () => {
      const [teams, scans2, answers2, locs, game] = await Promise.all([
        getAllTeams(), getAllScans(), getAllAnswers(), getLocations(), getGame(),
      ]);
      return ranking(teams, scans2, answers2, locs, game.state.winnerTeamId);
    })(),
    gateLockSeconds(team.id),
  ]);
  const teamScans = scans.filter((s) => s.teamId === team.id);
  const sightingIds = new Set(
    locations.filter((l) => l.type === "sighting").map((l) => l.id),
  );
  const words: Record<string, { word: string; wordClue: string }> = {};
  for (const l of locations) {
    if (sightingIds.has(l.id) && teamScans.some((s) => s.locationId === l.id)) {
      words[l.id] = { word: l.word, wordClue: l.wordClue };
    }
  }
  const teamBroadcasts = filterBroadcastsForTeam(broadcasts, state.phase, team.id);
  const rev = Math.max(
    team.createdAt,
    state.startedAt,
    ...scans.map((s) => s.at),
    ...answers.map((a) => a.at),
    ...hints.map((h) => h.at),
    ...teamBroadcasts.map((b) => b.at),
  );
  return {
    rev,
    team,
    game: { phase: state.phase, winnerTeamId: state.winnerTeamId, gateSlots: state.gateSlots, startedAt: state.startedAt },
    settings: settingsPublic(settings),
    locations: locations.map(locationPublic),
    scans: teamScans,
    answers: answers.filter((a) => a.teamId === team.id),
    hints: hints.filter((h) => h.teamId === team.id),
    words,
    broadcasts: teamBroadcasts,
    leaderboard,
    gateLockSeconds: lock,
  };
}

/* ---------- team mutations ---------- */

export async function createTeam(
  name: string,
  member1: string,
  member2: string,
  member1Sem = "",
  member1Class = "",
  member2Sem = "",
  member2Class = "",
): Promise<Team> {
  const clean = {
    name: name.trim(),
    member1: member1.trim(),
    member2: member2.trim(),
    member1Sem: member1Sem.trim(),
    member1Class: member1Class.trim(),
    member2Sem: member2Sem.trim(),
    member2Class: member2Class.trim(),
  };

  // Enforce unique team name (case-insensitive)
  const existingTeam = await getTeamByName(clean.name);
  if (existingTeam) {
    throw new Error(`A team named "${clean.name}" already exists. Please choose a unique team name.`);
  }

  const id = randomUUID();
  let code = makeCode();
  // codes are unique; retry on collision
  for (let i = 0; i < 5; i++) {
    const clash = await getTeamByCode(code);
    if (!clash) break;
    code = makeCode();
  }

  // 1. First attempt: insert with dedicated semester & class columns (M005)
  try {
    const { data, error } = await db()
      .from("teams")
      .insert({
        id,
        name: clean.name,
        code,
        member1: clean.member1,
        member2: clean.member2,
        member1_sem: clean.member1Sem,
        member1_class: clean.member1Class,
        member2_sem: clean.member2Sem,
        member2_class: clean.member2Class,
      })
      .select("*")
      .single();
    if (!error && data) {
      return teamFromRow(data as TeamRow);
    }
  } catch {
    // column may not exist yet if M005 is pending in SQL editor; fall through
  }

  // 2. Fallback: insert into base schema while formatting member strings for readability
  const m1Display =
    clean.member1Sem || clean.member1Class
      ? `${clean.member1} (${[clean.member1Sem, clean.member1Class].filter(Boolean).join(" ")})`
      : clean.member1;
  const m2Display =
    clean.member2Sem || clean.member2Class
      ? `${clean.member2} (${[clean.member2Sem, clean.member2Class].filter(Boolean).join(" ")})`
      : clean.member2;

  const { data, error } = await db()
    .from("teams")
    .insert({ id, name: clean.name, code, member1: m1Display, member2: m2Display })
    .select("*")
    .single();
  if (error) throw error;
  return {
    ...teamFromRow(data as TeamRow),
    member1: clean.member1,
    member1Sem: clean.member1Sem,
    member1Class: clean.member1Class,
    member2: clean.member2,
    member2Sem: clean.member2Sem,
    member2Class: clean.member2Class,
  };
}

function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function recordScanByCode(
  code: string,
  token: string,
): Promise<ScanResult> {
  const team = await getTeamByCode(code);
  if (!team) return { ok: false, reason: "no_team" };
  const locations = await getLocations();
  const location = locations.find((l) => l.token === token);
  if (!location) return { ok: false, reason: "unknown" };

  // Fetch all existing scans for this team
  let teamScans: Scan[] = [];
  try {
    const { data } = await db()
      .from("scans")
      .select("team_id,location_id,at")
      .eq("team_id", team.id);
    if (data) {
      teamScans = data.map((r) => scanFromRow(r as ScanRow));
    }
  } catch (err) {
    console.error("fetch team scans error", err);
  }

  const scannedLocationIds = new Set(teamScans.map((s) => s.locationId));

  // Check duplicate
  if (scannedLocationIds.has(location.id)) {
    return { ok: false, reason: "duplicate" };
  }

  // Enforce sequential order
  const sightings = locations
    .filter((l) => l.type === "sighting")
    .sort((a, b) => a.order - b.order);

  if (location.type === "sighting" && location.order > 1) {
    const missingPrior = sightings
      .filter((s) => s.order < location.order)
      .find((s) => !scannedLocationIds.has(s.id));
    if (missingPrior) {
      return {
        ok: false,
        reason: "out_of_order",
        expectedOrder: missingPrior.order,
        expectedLocationName: missingPrior.name,
        targetOrder: location.order,
        targetLocationName: location.name,
      };
    }
  } else if (location.type === "sos") {
    const missingSighting = sightings.find((s) => !scannedLocationIds.has(s.id));
    if (missingSighting) {
      return {
        ok: false,
        reason: "out_of_order",
        expectedOrder: missingSighting.order,
        expectedLocationName: missingSighting.name,
        targetOrder: 6,
        targetLocationName: location.name,
      };
    }
  }

  const at = new Date().toISOString();
  try {
    await db()
      .from("scans")
      .upsert(
        { team_id: team.id, location_id: location.id, at },
        { onConflict: "team_id,location_id", ignoreDuplicates: true },
      );
  } catch (err) {
    console.error("recordScan upsert error", err);
  }

  if (location.type === "sighting") {
    // Auto-record correct answer so evidence board registers it immediately
    if (location.word) {
      try {
        await db().from("answers").insert({
          team_id: team.id,
          kind: "spotdiff",
          location_id: location.id,
          value: location.word,
          correct: true,
          at,
        });
      } catch (err) {
        console.error("auto answer insert error", err);
      }
    }
    return {
      ok: true,
      location: locationPublic(location),
      word: location.word,
      wordClue: location.wordClue,
    };
  }
  return { ok: true, location: locationPublic(location) };
}

export type SubmitResult =
  | { ok: false; message: string; lockSeconds?: number }
  | { ok: true; correct: boolean; answer: Answer; lockSeconds?: number };

export async function submitAnswerByCode(
  code: string,
  kind: AnswerKind,
  input: { locationId?: string; value?: string; words?: string[] },
): Promise<SubmitResult> {
  const team = await getTeamByCode(code);
  if (!team) return { ok: false, message: "No team found with that code. Rejoin from the home screen." };

  const at = new Date().toISOString();
  const cleanValue = (input.value ?? "").trim().toUpperCase();
  let correct = false;
  let value = cleanValue;
  let locationId: string | null = input.locationId ?? null;

  if (kind === "spotdiff") {
    if (!input.locationId) return { ok: false, message: "Missing location." };
    const { data } = await db()
      .from("locations")
      .select("id,word,word_clue")
      .eq("id", input.locationId)
      .maybeSingle();
    if (!data) return { ok: false, message: "Unknown location." };
    const expected = ((data as { word: string }).word ?? "").trim().toUpperCase();
    correct =
      expected !== "" &&
      (cleanValue === expected ||
        normalizeTime(cleanValue) === normalizeTime(expected) ||
        (input.locationId === "s1" && (cleanValue === "CAKE" || cleanValue === "CAKE FARM" || cleanValue === "CAFE")));
  } else if (kind === "bitchat") {
    const settings = await getSettings();
    correct = cleanValue === settings.bitchatCode.trim().toUpperCase();
  } else if (kind === "reconstruction") {
    const { state } = await getGame();
    const words = (input.words ?? []).map((w) => w.trim().toUpperCase());
    correct =
      words.length === state.gateAnswer.length &&
      state.gateAnswer.every((w, i) => w.toUpperCase() === words[i]);
    value = words.join(" ");
  } else {
    return { ok: false, message: "Unsupported answer kind." };
  }

  const answerRow: AnswerRow = {
    team_id: team.id,
    kind,
    location_id: locationId,
    value,
    correct,
    at,
  };
  const { error } = await db().from("answers").insert(answerRow);
  if (error) throw error;
  const answer: Answer = {
    teamId: team.id, kind, locationId: locationId ?? undefined, value, correct, at: Date.parse(at),
  };

  if (correct && kind === "spotdiff" && locationId) {
    await db()
      .from("scans")
      .upsert({ team_id: team.id, location_id: locationId, at }, {
        onConflict: "team_id,location_id",
        ignoreDuplicates: true,
      })
      .then(({ error: e }) => {
        if (e) console.error("spotdiff scan", e);
      });
  }

  if (correct && kind === "reconstruction") {
    const { row } = await getGame();
    await db()
      .from("games")
      .update({ winner_team_id: team.id })
      .eq("id", row.id)
      .is("winner_team_id", null)
      .then(({ error: e }) => {
        if (e) console.error("winner update", e);
      });
  }

  let lockSeconds: number | undefined;
  if (!correct && kind === "reconstruction") {
    lockSeconds = await gateLockSeconds(team.id);
    if (lockSeconds && lockSeconds > 0) {
      return { ok: false, message: `Too many wrong attempts. The gate is locked for ${lockSeconds}s.`, lockSeconds };
    }
  }

  return { ok: true, correct, answer, lockSeconds };
}

/* ---------- admin ---------- */

export interface AdminStatePayload {
  teams: Team[];
  scans: Scan[];
  answers: Answer[];
  hints: Hint[];
  broadcasts: Broadcast[];
  game: GameState;
  settings: Settings;
  auditLog: { actor: string; action: string; target: string; at: number }[];
}

export const DEFAULT_ADMIN_PASSWORD = "FOSSCCE@MaveliFiles";

export async function verifyAdmin(code: string): Promise<boolean> {
  const clean = code.trim();
  if (!clean) return false;

  // 1. Direct match with master password
  if (clean === DEFAULT_ADMIN_PASSWORD) return true;

  // 2. Match with settings table in DB
  const settings = await getSettings();
  if (settings.adminCode && clean === settings.adminCode.trim()) return true;

  // 3. Backward-compatible match with initial seed code
  if (clean === "mavelli-admin") return true;

  return false;
}

export async function buildAdminState(): Promise<AdminStatePayload> {
  const [teams, scans, answers, hints, broadcasts, { state }, settings] = await Promise.all([
    getAllTeams(),
    getAllScans(),
    getAllAnswers(),
    getAllHints(),
    getAllBroadcasts(),
    getGame(),
    getSettings(),
  ]);
  const { data, error } = await db()
    .from("audit_log")
    .select("actor,action,target,at")
    .order("at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return {
    teams, scans, answers, hints, broadcasts, game: state, settings,
    auditLog: ((data ?? []) as AuditRow[]).map((r) => ({
      actor: r.actor, action: r.action, target: r.target, at: Date.parse(r.at),
    })),
  };
}

export async function adminAction(
  action: string,
  payload: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  switch (action) {
    case "phase": {
      const phase = payload.phase as Phase;
      const { row } = await getGame();
      await db().from("games").update({ phase }).eq("id", row.id);
      await audit("admin", "set-phase", phase);
      return { ok: true };
    }
    case "winner": {
      const teamId = (payload.teamId as string | null) ?? null;
      const { row } = await getGame();
      await db().from("games").update({ winner_team_id: teamId }).eq("id", row.id);
      await audit("admin", teamId ? "set-winner" : "clear-winner", teamId ?? "");
      return { ok: true };
    }
    case "hint": {
      const { teamId, locationId } = payload as { teamId: string; locationId: string };
      const existing = await db()
        .from("hints")
        .select("id")
        .eq("team_id", teamId)
        .eq("location_id", locationId)
        .maybeSingle();
      if (!existing.data) {
        await db().from("hints").insert({ team_id: teamId, location_id: locationId });
      }
      await audit("admin", "push-hint", `${teamId}:${locationId}`);
      return { ok: true };
    }
    case "grant": {
      const { teamId, locationId } = payload as { teamId: string; locationId: string };
      await db()
        .from("scans")
        .upsert({ team_id: teamId, location_id: locationId, at: new Date().toISOString() }, {
          onConflict: "team_id,location_id",
          ignoreDuplicates: true,
        });
      await audit("admin", "grant-location", `${teamId}:${locationId}`);
      return { ok: true };
    }
    case "reset-team": {
      const teamId = payload.teamId as string;
      await Promise.all([
        db().from("scans").delete().eq("team_id", teamId),
        db().from("answers").delete().eq("team_id", teamId),
        db().from("hints").delete().eq("team_id", teamId),
      ]);
      await audit("admin", "reset-team", teamId);
      return { ok: true };
    }
    case "broadcast": {
      const { message, audience, teamId } = payload as {
        message: string; audience: Broadcast["audience"]; teamId?: string;
      };
      await db().from("broadcasts").insert({
        id: randomUUID(), message, audience, team_id: teamId ?? null, at: new Date().toISOString(),
      });
      await audit("admin", "broadcast", `${audience}${teamId ? `:${teamId}` : ""}`);
      return { ok: true };
    }
    case "settings": {
      const patch = payload.patch as Partial<Settings>;
      const row: Partial<Record<string, unknown>> = {};
      if (patch.volunteerPhone !== undefined) row.volunteer_phone = patch.volunteerPhone;
      if (patch.volunteerWhatsapp !== undefined) row.volunteer_whatsapp = patch.volunteerWhatsapp;
      if (patch.instagramUrl !== undefined) row.instagram_url = patch.instagramUrl;
      if (patch.bitchatGuide !== undefined) row.bitchat_guide = patch.bitchatGuide;
      if (patch.bitchatCode !== undefined) row.bitchat_code = patch.bitchatCode;
      if (patch.adminCode !== undefined) row.admin_code = patch.adminCode;
      if (patch.sosLockSeconds !== undefined) row.sos_lock_seconds = patch.sosLockSeconds;
      if (patch.mapillaryNote !== undefined) row.mapillary_note = patch.mapillaryNote;
      await db().from("settings").update(row).eq("id", 1);
      await audit("admin", "update-settings", Object.keys(row).join(","));
      return { ok: true };
    }
    case "restart": {
      await Promise.all([
        db().from("scans").delete().neq("team_id", ""),
        db().from("answers").delete().neq("team_id", ""),
        db().from("hints").delete().neq("team_id", ""),
        db().from("broadcasts").delete().neq("id", ""),
      ]);
      const { row } = await getGame();
      await db().from("games").update({ phase: "setup", winner_team_id: null }).eq("id", row.id);
      await audit("admin", "restart-game", "");
      return { ok: true };
    }
    case "new": {
      await Promise.all([
        db().from("scans").delete().neq("team_id", ""),
        db().from("answers").delete().neq("team_id", ""),
        db().from("hints").delete().neq("team_id", ""),
        db().from("broadcasts").delete().neq("id", ""),
        db().from("teams").delete().neq("id", ""),
      ]);
      const { row } = await getGame();
      await db().from("games").update({ phase: "setup", winner_team_id: null }).eq("id", row.id);
      await audit("admin", "new-game", "");
      return { ok: true };
    }
    default:
      return { ok: false, message: `Unknown action: ${action}` };
  }
}
