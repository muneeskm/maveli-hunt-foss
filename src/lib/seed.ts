import type { GameLocation, GameState, Settings } from "./types";

/*
 * PLACEHOLDER CONTENT.
 * Organizers replace words, clues, photos, and the gate answer tomorrow.
 * Real content is loaded directly into Supabase (seed script / SQL) - not through
 * a dashboard editor in v1. Everything below is a functional stand-in.
 *
 * The 5 words are fragments of a hidden instruction. Scan order (1-5) differs
 * from the gate order, so the evidence board alone cannot answer the gate.
 */

export const SEED_WORDS = ["TEMPLE", "NORTH", "THREE", "BANYAN", "CLOCK"] as const;

// Gate order: "NORTH TEMPLE CLOCK BANYAN THREE"
export const SEED_GATE_ANSWER = ["NORTH", "TEMPLE", "CLOCK", "BANYAN", "THREE"];

export const SEED_GATE_SLOTS = [
  "Word 1",
  "Word 2",
  "Word 3",
  "Word 4",
  "Word 5",
];

export const seedLocations = (): GameLocation[] => [
  {
    id: "s1",
    order: 1,
    type: "sighting",
    name: "Sighting 01 - The Mapillary View",
    token: "s1-kappa",
    word: "TEMPLE",
    wordClue: "A place of worship. He is not inside it, but near it.",
    photoUrl: "https://picsum.photos/seed/mavelli-sighting-1/1200/900",
    clueText:
      "Mavelli was last seen somewhere around the campus. The only image we recovered is a Mapillary street view. Open the Mapillary app or website, find this exact view, and identify the landmark it shows. That is where evidence marker 01 is waiting.",
    hintText:
      "Look for a tall landmark with a distinctive shape. The Mapillary view was captured from a road on the east side of the campus.",
    mapillaryNote: "This view was captured on Mapillary.",
  },
  {
    id: "s2",
    order: 2,
    type: "sighting",
    name: "Sighting 02",
    token: "s2-epsilon",
    word: "NORTH",
    wordClue: "A direction. Check a compass before you move on.",
    photoUrl: "https://picsum.photos/seed/mavelli-sighting-2/1200/900",
    clueText:
      "Mavelli was seen here carrying a small compass. He kept glancing at the needle and muttering about which way to go next.",
    hintText: "The building on the left faces north. Look at the wall clock's shadow.",
  },
  {
    id: "s3",
    order: 3,
    type: "sighting",
    name: "Sighting 03",
    token: "s3-lambda",
    word: "THREE",
    wordClue: "A small number. Count your steps from the landmark.",
    photoUrl: "https://picsum.photos/seed/mavelli-sighting-3/1200/900",
    clueText:
      "A student saw Mavelli here counting out loud. Three of something, then a pause, then three again. He seemed to be measuring.",
    hintText: "Count the arches. Then count the benches in the shade.",
  },
  {
    id: "s4",
    order: 4,
    type: "sighting",
    name: "Sighting 04",
    token: "s4-sigma",
    word: "BANYAN",
    wordClue: "A tree with hanging roots. It shades the courtyard.",
    photoUrl: "https://picsum.photos/seed/mavelli-sighting-4/1200/900",
    clueText:
      "Mavelli was seen resting in the shade of an old tree. The gardener says he spoke to it like an old friend.",
    hintText: "Look for the oldest tree on campus. It has more roots than branches.",
  },
  {
    id: "s5",
    order: 5,
    type: "sighting",
    name: "Sighting 05",
    token: "s5-tau",
    word: "CLOCK",
    wordClue: "It tells time. It stands tall near the entrance.",
    photoUrl: "https://picsum.photos/seed/mavelli-sighting-5/1200/900",
    clueText:
      "The last sighting. Mavelli stood in front of this landmark for a long time, checked his watch against it, and then walked away into the dark.",
    hintText: "It chimes every hour, and it faces the main gate.",
  },
  {
    id: "sos",
    order: 6,
    type: "sos",
    name: "Emergency Transmission",
    token: "sos-delta",
    word: "",
    wordClue: "",
    photoUrl: "",
    clueText:
      "Search this block. Somewhere inside it, Mavelli's emergency signal is broadcasting. Find the transmission poster and scan the code on it.",
    hintText: "Check the notice boards near the stairwells.",
  },
  {
    id: "fin",
    order: 7,
    type: "final",
    name: "Final Location",
    token: "fin-omega",
    word: "",
    wordClue: "",
    photoUrl: "",
    clueText:
      "This is where Mavelli is hiding. Reconstruct the instruction from the five words you collected and prove it at the gate.",
    hintText: "",
  },
];

export const seedGame = (): GameState => ({
  phase: "setup",
  winnerTeamId: null,
  gateAnswer: [...SEED_GATE_ANSWER],
  gateSlots: [...SEED_GATE_SLOTS],
  startedAt: Date.now(),
});

export const seedSettings = (): Settings => ({
  volunteerPhone: "+91 00000 00000", // TODO: real volunteer number
  volunteerWhatsapp: "https://wa.me/910000000000", // TODO: real WhatsApp link
  instagramUrl: "https://instagram.com", // TODO: Mavelli's Instagram handle
  bitchatGuide:
    "Mavelli has been broadcasting on BitChat. Open the BitChat app, find the account named in the SOS, and read the latest message. It contains a code. Enter that code here.",
  bitchatCode: "MERIDIAN", // TODO: replace before the event
  adminCode: "mavelli-admin", // TODO: change for the event
  sosLockSeconds: 4,
  mapillaryNote:
    "Open Mapillary (app or mapillary.com), search this campus, and find the view that matches the photo above.",
});
