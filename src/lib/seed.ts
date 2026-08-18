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
];

export const seedLocations = (): GameLocation[] => [
  {
    id: "s1",
    order: 1,
    type: "sighting",
    name: "Sighting 01 - The Arrival (Main Gate)",
    token: "s1-kappa",
    word: "", // answer lives server-side (locations.word)
    wordClue: "", // answer lives server-side
    photoUrl: "/locations/s1-main-gate.jpg",
    mapillaryUrl:
      "https://www.mapillary.com/app/?lat=10.354009631796927&lng=76.21246825414289&z=17&pKey=510423848695905&focus=photo&x=0.5065599523580567&y=0.5078155992984406&zoom=0",
    clueText:
      "Maveli remembers entering through the campus main gate. Compare the street-level Mapillary view of the entrance with the website photo to spot what changed, then proceed to that sponsor location to continue the search.",
    hintText:
      "Compare the poster boards near the entrance. One shows the Cake Farm Cafe logo.",
    mapillaryNote:
      "Open Mapillary for an interactive 360° capture of the entrance. Compare it with the photo on this site to identify the altered sponsor poster.",
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
      "Maveli stopped by Cake Farm Cafe courtyard. Find and scan the QR code stationed at Cake Farm Cafe to unlock Maveli's campus timeline and Instagram channel.",
    hintText: "Look around the cafe seating and ordering counter for the QR code sheet.",
    mapillaryNote:
      "Scan the QR code on-site at Cake Farm Cafe to unlock Maveli's Instagram transmission channel.",
  },
  {
    id: "s3",
    order: 3,
    type: "sighting",
    name: "Sighting 03 - Christ Cafe",
    token: "s3-lambda",
    word: "",
    wordClue: "",
    photoUrl: "/locations/s3-umbrella.jpg",
    mapillaryUrl: "",
    clueText:
      "Maveli was last tracked near Christ Cafe before losing connection. Check his Instagram feed (@maveli.thamburan_) to discover the exact disconnection timestamp.",
    hintText: "Inspect Maveli's Instagram posts to find the timestamp of his last transmission.",
    mapillaryNote:
      "Enter the exact timestamp (12:13) from Maveli's Instagram post to verify his disconnection point.",
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
      "Maveli was last seen in front of the reception at St. Mary's Block on his Instagram feed. Find and scan the QR code located in front of the reception to conclude Day 1.",
    hintText: "Check the reception counter area inside the St. Mary's Block entrance portico.",
    mapillaryNote:
      "Scan the QR code in front of the St. Mary's Block reception to lock in Day 1 evidence.",
  },
  {
    id: "sos",
    order: 5,
    type: "sos",
    name: "SOS Transmission",
    token: "sos-delta",
    word: "",
    wordClue: "",
    photoUrl: "",
    mapillaryUrl: "",
    clueText:
      "Maveli broke radio silence with an SOS broadcast on campus. Reach the broadcasting area and scan the Emergency SOS poster.",
    hintText: "Look for the brightly printed MAVELI EMERGENCY TRANSMISSION poster.",
  },
  {
    id: "fin",
    order: 6,
    type: "final",
    name: "Final Sanctuary",
    token: "fin-omega",
    word: "",
    wordClue: "",
    photoUrl: "",
    mapillaryUrl: "",
    clueText:
      "This is where Maveli is sheltered. Reconstruct the instruction from the recovered clues and prove it at the gate.",
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
  volunteerPhone: "+91 94000 00000",
  volunteerWhatsapp: "https://chat.whatsapp.com/FFQ517Asdpv13omB9ArMwv",
  instagramUrl:
    "https://www.instagram.com/maveli.thamburan_?igsh=MWo1ZW5mc3h3bTllOA==&igsi=MWo1ZW5mc3h3bTllOA==",
  bitchatGuide:
    "Maveli has been broadcasting on BitChat. Open the BitChat app, find the account named in the SOS, and read the latest message. It contains a code. Enter that code here.",
  bitchatCode: "", // secret - lives server-side (settings.bitchat_code)
  adminCode: "", // secret - lives server-side (settings.admin_code)
  sosLockSeconds: 4,
  mapillaryNote:
    "Open Mapillary to explore open street-level imagery of the campus gate. Spot the sponsor difference (Cake Farm Cafe) to proceed.",
  eventStartIso: "2026-08-19T14:40:00+05:30",
  day1EndIso: "2026-08-19T15:40:00+05:30",
  day2StartIso: "2026-08-20T14:40:00+05:30",
  day2EndIso: "2026-08-20T15:40:00+05:30",
});
