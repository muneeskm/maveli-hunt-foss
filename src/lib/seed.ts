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
    name: "Sighting 01 - The Main Gate",
    token: "s1-kappa",
    word: "", // answer lives server-side (locations.word)
    wordClue: "", // answer lives server-side
    photoUrl: "https://picsum.photos/seed/mavelli-website-1/1200/900",
    mapillaryUrl: "https://www.mapillary.com/app/?pKey=REPLACE_WITH_REAL_VIEW_1",
    clueText:
      "Mavelli was last seen near the main gate. Open the Mapillary view of this spot, then compare it with the photo on this site. One word has been changed. Type the word that differs to recover the evidence.",
    hintText:
      "Look at the signage in the photo. One word on the board is different from the Mapillary capture.",
    mapillaryNote:
      "The Mapillary view is the original. The site photo is a modified copy - one word was changed.",
  },
  {
    id: "s2",
    order: 2,
    type: "sighting",
    name: "Sighting 02 - The Compass Corner",
    token: "s2-epsilon",
    word: "",
    wordClue: "",
    photoUrl: "https://picsum.photos/seed/mavelli-website-2/1200/900",
    mapillaryUrl: "https://www.mapillary.com/app/?pKey=REPLACE_WITH_REAL_VIEW_2",
    clueText:
      "Mavelli was seen here carrying a small compass. Open the Mapillary view of this spot and compare it with the photo here. One word has been changed. Type it to recover the evidence.",
    hintText: "The direction marker on the wall differs between the two images.",
    mapillaryNote:
      "Compare every sign and marker. Only one word differs.",
  },
  {
    id: "s3",
    order: 3,
    type: "sighting",
    name: "Sighting 03 - The Arches",
    token: "s3-lambda",
    word: "",
    wordClue: "",
    photoUrl: "https://picsum.photos/seed/mavelli-website-3/1200/900",
    mapillaryUrl: "https://www.mapillary.com/app/?pKey=REPLACE_WITH_REAL_VIEW_3",
    clueText:
      "A student saw Mavelli here counting out loud. Open the Mapillary view and compare it with the photo here. One word has been changed. Type it to recover the evidence.",
    hintText: "The plaque under the arches has one extra word on this site.",
    mapillaryNote:
      "The Mapillary view is the original. The site photo is a modified copy - one word was changed.",
  },
  {
    id: "s4",
    order: 4,
    type: "sighting",
    name: "Sighting 04 - The Old Tree",
    token: "s4-sigma",
    word: "",
    wordClue: "",
    photoUrl: "https://picsum.photos/seed/mavelli-website-4/1200/900",
    mapillaryUrl: "https://www.mapillary.com/app/?pKey=REPLACE_WITH_REAL_VIEW_4",
    clueText:
      "Mavelli was seen resting in the shade of an old tree. Open the Mapillary view and compare it with the photo here. One word has been changed. Type it to recover the evidence.",
    hintText: "The board beside the tree names the species differently in the two images.",
    mapillaryNote:
      "The Mapillary view is the original. The site photo is a modified copy - one word was changed.",
  },
  {
    id: "s5",
    order: 5,
    type: "sighting",
    name: "Sighting 05 - The Clock Tower",
    token: "s5-tau",
    word: "",
    wordClue: "",
    photoUrl: "https://picsum.photos/seed/mavelli-website-5/1200/900",
    mapillaryUrl: "https://www.mapillary.com/app/?pKey=REPLACE_WITH_REAL_VIEW_5",
    clueText:
      "The last sighting. Mavelli stood in front of this landmark for a long time, checking his watch against it. Open the Mapillary view and compare it with the photo here. One word has been changed. Type it to recover the final evidence.",
    hintText: "The inscription at the base of the tower differs by one word.",
    mapillaryNote:
      "The Mapillary view is the original. The site photo is a modified copy - one word was changed.",
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
    mapillaryUrl: "",
    clueText:
      "This is where Mavelli is hiding. Reconstruct the instruction from the five words you collected and prove it at the gate.",
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
