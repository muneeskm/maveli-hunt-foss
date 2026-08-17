export type Phase = "setup" | "day1" | "night" | "day2" | "rescued" | "ended";

export type LocationType = "sighting" | "sos" | "final";

export interface GameLocation {
  id: string;
  order: number; // sighting order 1-5; sos/final use 6/7
  type: LocationType;
  name: string;
  token: string; // QR secret, encoded in the scan URL
  word: string; // sighting only
  wordClue: string; // contextual hint about the word's role in the final instruction
  photoUrl: string; // sighting only
  clueText: string;
  hintText: string; // Level 1 hint, admin-pushed
  mapillaryNote?: string; // shown on the Mapillary sighting only
}

export interface Team {
  id: string;
  name: string;
  code: string;
  member1: string;
  member2: string;
  createdAt: number;
}

export interface Scan {
  teamId: string;
  locationId: string;
  at: number;
}

export type AnswerKind = "bitchat" | "reconstruction" | "manual";

export interface Answer {
  teamId: string;
  kind: AnswerKind;
  value: string;
  correct: boolean;
  at: number;
}

export interface Hint {
  teamId: string;
  locationId: string;
  at: number;
}

export interface Broadcast {
  id: string;
  message: string;
  audience: "all" | "day1" | "day2" | "team";
  teamId?: string;
  at: number;
}

export interface Settings {
  volunteerPhone: string;
  volunteerWhatsapp: string;
  instagramUrl: string;
  bitchatGuide: string; // displayed on the BitChat step
  bitchatCode: string; // code Mavelli sends via BitChat
  adminCode: string; // shared admin login
  sosLockSeconds: number; // drama delay before the SOS alarm resolves
  mapillaryNote: string; // guidance shown on sighting 1
}

export interface GameState {
  phase: Phase;
  winnerTeamId: string | null;
  gateAnswer: string[]; // words in the required instruction order
  gateSlots: string[]; // blank-slot labels shown at the gate
  startedAt: number;
}

export interface StageInfo {
  key: string;
  label: string;
  location?: GameLocation; // current sighting to solve
}

export interface DB {
  game: GameState;
  teams: Team[];
  scans: Scan[];
  answers: Answer[];
  hints: Hint[];
  broadcasts: Broadcast[];
  settings: Settings;
}

export interface LeaderboardRow {
  team: Team;
  scans: Scan[];
  correctReconstructionAt: number | null;
  rank: number;
}
