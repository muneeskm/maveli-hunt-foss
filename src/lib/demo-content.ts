import { seedGame, seedLocations, seedSettings } from "./seed";
import type { GameLocation, GameState, Settings } from "./types";

/*
 * DEMO-ONLY ANSWER CONTENT.
 *
 * Placeholder words, gate answer, BitChat code and admin code for demo mode
 * (localStorage, no backend). NEVER import this file from anything reachable
 * in real mode - it contains the answers. It is imported ONLY by the demo
 * store (src/lib/store.ts), and the `store` facade selects the demo store
 * with a build-time constant, so dead-code elimination drops this module
 * from real-mode production bundles. The deployed build is verified by
 * grepping the output chunks for these values (see WALKTHROUGH.md).
 */

export const DEMO_WORDS = ["CAKE", "FARM", "12:13", "BANYAN"] as const;

// Gate order: "CAKE FARM 12:13 BANYAN"
export const DEMO_GATE_ANSWER = ["CAKE", "FARM", "12:13", "BANYAN"];

export const DEMO_BITCHAT_CODE = "MERIDIAN";
export const DEMO_ADMIN_CODE = "FOSSCCE@MaveliFiles";

const DEMO_WORD_CLUES: Record<string, string> = {
  CAKE: "Sponsor poster difference discovered at the main entrance.",
  FARM: "QR Checkpoint confirmed at Cake Farm Cafe.",
  "12:13": "Disconnection timestamp verified from Maveli's Instagram transmission.",
  BANYAN: "Final Day 1 reception checkpoint locked at St. Mary's Block.",
};

const DEMO_WORDS_BY_ID: Record<string, string> = {
  s1: DEMO_WORDS[0],
  s2: DEMO_WORDS[1],
  s3: DEMO_WORDS[2],
  s4: DEMO_WORDS[3],
};

/** Demo locations = public content + the placeholder words/clues. */
export function demoLocations(): GameLocation[] {
  return seedLocations().map((l) => ({
    ...l,
    word: DEMO_WORDS_BY_ID[l.id] ?? "",
    wordClue: l.wordClue || (DEMO_WORD_CLUES[DEMO_WORDS_BY_ID[l.id]] ?? ""),
  }));
}

export function demoGame(): GameState {
  const g = seedGame();
  return { ...g, gateAnswer: [...DEMO_GATE_ANSWER] };
}

export function demoSettings(): Settings {
  const s = seedSettings();
  return { ...s, bitchatCode: DEMO_BITCHAT_CODE, adminCode: DEMO_ADMIN_CODE };
}
