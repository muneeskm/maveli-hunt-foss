import type { GameLocation, GameState, Settings } from "./types";

/*
 * PUBLIC CONTENT (safe to ship to every client).
 *
 * This file must NEVER contain answers: the 5 words, the gate answer order,
 * the BitChat code, or the admin code. Those live only in the database
 * (supabase/seed.sql) and are verified server-side by the API routes
 * (src/app/api/*) using the service-role key. Demo mode fills the blanks
 * from src/lib/demo-content.ts, which is imported ONLY by the demo store and
 * is tree-shaken out of real-mode builds.
 *
 * DAY 1 MECHANIC (all sightings):
 *   Every sighting shows a Mapillary view of a real campus spot. The site
 *   shows a MODIFIED copy of the same image where ONE word was changed
 *   (e.g. Mapillary: "Christ College of Engineering" vs site:
 *   "Christ College of Engineering (Autonomous)"). Teams find the difference
 *   and TYPE the word ("Autonomous") to recover the evidence. The server
 *   checks the word; clients never see it until the team earns it.
 */

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
    name: "Sighting 01 - Main Gate",
    token: "s1-kappa",
    word: "", // answer lives server-side (locations.word)
    wordClue: "", // answer lives server-side
    photoUrl: "/locations/s1-main-gate.jpg",
    mapillaryUrl: "",
    clueText:
      "Maveli was spotted near the main entrance arch of Christ College of Engineering. Find and scan the QR code located near the main gate.",
    hintText:
      "Check the stone arch pillars near Gate 1.",
    mapillaryNote:
      "Scan the QR code on-site to verify the landmark evidence.",
  },
  {
    id: "s2",
    order: 2,
    type: "sighting",
    name: "Sighting 02 - Cake Farm Cafe",
    token: "s2-epsilon",
    word: "",
    wordClue: "",
    photoUrl: "/locations/s2-cake-farm.jpg",
    mapillaryUrl: "",
    clueText:
      "Maveli stopped by Cake Farm Cafe courtyard. Find the QR code stationed near the cafe stall.",
    hintText: "Look around the cafe seating and ordering counter.",
    mapillaryNote:
      "Scan the QR code on-site to verify the landmark evidence.",
  },
  {
    id: "s3",
    order: 3,
    type: "sighting",
    name: "Sighting 03 - Green Umbrella",
    token: "s3-lambda",
    word: "",
    wordClue: "",
    photoUrl: "/locations/s3-umbrella.jpg",
    mapillaryUrl: "",
    clueText:
      "Maveli took shade under the green outdoor umbrella seating. Scan the QR code placed by the umbrella table.",
    hintText: "Check the circular umbrella seating area near the garden.",
    mapillaryNote:
      "Scan the QR code on-site to verify the landmark evidence.",
  },
  {
    id: "s4",
    order: 4,
    type: "sighting",
    name: "Sighting 04 - St. Mary's Block",
    token: "s4-sigma",
    word: "",
    wordClue: "",
    photoUrl: "/locations/s4-st-marys-block.jpg",
    mapillaryUrl: "",
    clueText:
      "Maveli was seen walking across the courtyard toward St. Mary's Block. Locate the QR code near the building entrance.",
    hintText: "Look near the front portico pillars of St. Mary's Block.",
    mapillaryNote:
      "Scan the QR code on-site to verify the landmark evidence.",
  },
  {
    id: "s5",
    order: 5,
    type: "sighting",
    name: "Sighting 05 - Techies Park",
    token: "s5-tau",
    word: "",
    wordClue: "",
    photoUrl: "/locations/s5-techies-park.jpg",
    mapillaryUrl: "",
    clueText:
      "The final sighting was at Techies Park. Scan the QR code on the signboard to decrypt the last sighting.",
    hintText: "Check the green Techies Park board beside the walkway.",
    mapillaryNote:
      "Scan the QR code on-site to verify the landmark evidence.",
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
    mapillaryUrl: "",
    clueText:
      "Search this block. Somewhere inside it, Maveli's emergency signal is broadcasting. Find the transmission poster and scan the code on it.",
    hintText: "Check the notice boards near the stairwells.",
  },
  {
    id: "fin",
    order: 7,
    type: "final",
    name: "Final Sanctuary",
    token: "fin-omega",
    word: "",
    wordClue: "",
    photoUrl: "",
    mapillaryUrl: "",
    clueText:
      "This is where Maveli is hiding. Reconstruct the instruction from the five words you collected and prove it at the gate.",
    hintText: "",
  },
];

export const seedGame = (): GameState => ({
  phase: "setup",
  winnerTeamId: null,
  gateAnswer: [], // answer lives server-side (games.gate_answer)
  gateSlots: [...SEED_GATE_SLOTS],
  startedAt: Date.now(),
});

export const seedSettings = (): Settings => ({
  volunteerPhone: "+91 00000 00000", // TODO: real volunteer number
  volunteerWhatsapp: "https://wa.me/910000000000", // TODO: real WhatsApp link
  instagramUrl: "https://instagram.com", // TODO: Mavelli's Instagram handle
  bitchatGuide:
    "Mavelli has been broadcasting on BitChat. Open the BitChat app, find the account named in the SOS, and read the latest message. It contains a code. Enter that code here.",
  bitchatCode: "", // secret - lives server-side (settings.bitchat_code)
  adminCode: "", // secret - lives server-side (settings.admin_code)
  sosLockSeconds: 4,
  mapillaryNote:
    "Open Mapillary (app or mapillary.com) and find the view for this spot. Compare it with the photo on this site and type the one word that differs.",
});
