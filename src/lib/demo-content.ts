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

export const DEMO_WORDS = ["TEMPLE", "NORTH", "THREE", "BANYAN", "CLOCK"] as const;

// Gate order: "NORTH TEMPLE CLOCK BANYAN THREE"
export const DEMO_GATE_ANSWER = ["NORTH", "TEMPLE", "CLOCK", "BANYAN", "THREE"];

export const DEMO_BITCHAT_CODE = "MERIDIAN";
export const DEMO_ADMIN_CODE = "FOSSCCE@MaveliFiles";

const DEMO_WORD_CLUES: Record<string, string> = {
  TEMPLE: "A place of worship. He is not inside it, but near it.",
  NORTH: "A direction. Check a compass before you move on.",
  THREE: "A small number. Count your steps from the landmark.",
  BANYAN: "A tree with hanging roots. It shades the courtyard.",
  CLOCK: "It tells time. It stands tall near the entrance.",
};

const DEMO_WORDS_BY_ID: Record<string, string> = {
  s1: DEMO_WORDS[0],
  s2: DEMO_WORDS[1],
  s3: DEMO_WORDS[2],
  s4: DEMO_WORDS[3],
  s5: DEMO_WORDS[4],
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
