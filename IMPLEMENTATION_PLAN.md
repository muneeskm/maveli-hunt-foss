# FOSS Mavelli Hunt — Implementation Plan (v4)

> **Status: v4**, revised after game-design feedback. Build window: 1 day (Section 11).
> Nothing is running right now (workspace was restarted); plan only, no code yet.

---

## 1. Product summary

A 2-day, story-driven, Onam-themed hunt. Teams match website photos to real campus locations,
find standardized Mavelli evidence markers, scan QR codes to collect 5 words, hit a Day 1 dead
end, and return on Day 2 to rescue Mavelli via an SOS, BitChat, and a final instruction-
reconstruction gate. First team to finish wins. Everything syncs in real time across both phones.

**Locked decisions:**
- Name: **FOSS Mavelli Hunt**. Logo/branding = placeholder. Domain: `maveli-hunt.vercel.app`
- ~30-50 teams, **exactly 2 members each** (fixed), both names mandatory, registered on the spot
- No auth: team creation produces a 6-char alphanumeric access code; both members log in with it
- Stack: Next.js + TypeScript + Tailwind + Supabase + Vercel, free tiers only
- Photos shown on the website; photo-to-location matching is the clue
- **Sighting 1 is the Mapillary one**: the Mapillary image contains a distinctive landmark
  (building, sign, statue) that teams must interpret to locate sighting 2's marker. Genuine
  puzzle, not "go find this picture"
- **5 word-QRs** (5 Day 1 sightings), each reveals a word + a small contextual clue into a
  persistent evidence board. The words are **fragments of a hidden final instruction**; their
  significance is not explained as they are collected
- **Final gate**: at the final location, a QR presents the reconstruction puzzle. Teams place
  the 5 words into the hidden instruction (exact order, derived from the contextual clues, and
  the instruction order differs from scan order). First correct reconstruction = winner. Teams
  keep playing after a winner, for placement
- **Winner = earliest finish.** Leaderboard: finished teams by completion timestamp, then
  unfinished teams by furthest stage, then latest activity timestamp
- SOS triggered by a QR at the search area (no GPS geofence); admin override + volunteer code
  as fallback
- BitChat is a real app teams are guided to; the code from Mavelli's BitChat message is typed
  into the site to unlock the final hunt. **Admin fallback unlocks the final hunt if BitChat fails**
- **"Contact volunteers"** option on the site: call / WhatsApp buttons for stuck teams
- **Three-level stuck-team protocol:** Level 1 admin-pushed hint, Level 2 volunteer call/WhatsApp
  (scripted, never reveals answers), Level 3 admin intervention (manual advance, audit-logged)
- **Phases are set manually by the admin:** SET DAY 1 / SET NIGHT / SET DAY 2 / END EVENT.
  No scheduling engine in v1. Content is server-gated by the current phase
- Admin: one shared login; advance/unlock, hints, approve answers, add teams, live leaderboard,
  phase control, QR print sheet, **restart (keeps teams) vs new game (wipes everything)**,
  end event (locks + records winner + data export). **No content editor in v1** (see Section 9)
- **No archive/snapshot system:** teams, scans, answers, and timestamps ARE the history.
  End-event data export covers anything else
- Palette: **black / green / white dark theme**. Pure English copy for now

---

## 2. Design system

- **Background:** near-black (`#0A0D0A` / `#0D0D0D`). Text: white/off-white.
- **Green accents (club identity):** bright green (`#00E676` family) for active/alarm states,
  dimmer muted green (`#1F6F3D`-ish) for idle/disabled. Green is the single accent, everywhere.
- **Onam touches, subtle:** low-opacity green pookalam-style rings behind the intro ping and idle
  states; a thin green chevron motif in the phase banner.
- **Dramatic moments:** opening "NOT FOUND!" ping, "MAVELLI SOS DETECTED", and the winner screen
  get brighter green + scanline/pulse treatments on the same black base.
- **Mobile-first:** single column, thumb-reach actions, 44px+ touch targets, no hover-only
  interactions, safe-area insets, large clue text.
- Font: mono/techy labels (Space Grotesk / IBM Plex Mono feel) for the tracker voice, readable
  sans for body. Pure English copy.
- Admin dashboard: desktop-friendly layout, same tokens.

---

## 3. Stack (confirmed)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js App Router + TypeScript | SSR for content, client components for live tracking |
| Styling | Tailwind CSS | Enforces design tokens |
| Backend/DB | Supabase free tier | Postgres + Realtime + Auth (admin only) |
| Hosting | Vercel free tier | `maveli-hunt.vercel.app`; QR URLs depend on this |
| Maps | None required | Mapillary = external guidance only |
| Geo | None | SOS triggered by QR at the search area |

---

## 4. Architecture

```
Team phones (2 per team, both logged in with the access code)
  │
  ├─ public routes: intro, join-the-search, leaderboard
  ├─ app routes (access-code gated): team home + evidence board, sighting, scan results,
  │    SOS, BitChat step, final gate, contact volunteers
  └─ admin routes (shared login): dashboard, phase control, QR print sheet
  │
  ▼
Next.js (Vercel) ──► Supabase: Postgres + Realtime + Auth
```

- **Server-gated content:** photos, clues, words, and the gate answer live in the DB/API only.
  Routes refuse content the team's state/phase does not allow.
- **Realtime:** Supabase channels push scans, phase changes, broadcasts, and leaderboard updates
  to all logged-in devices. A scan on one phone appears on the other instantly.
- **QR flow:** each location QR encodes `https://maveli-hunt.vercel.app/scan/<locationToken>`.
  Opening it while logged in records the scan for that team (first scan per team wins); if not
  logged in, redirect to "Join the search!" then bounce back to the scan URL.

---

## 5. Data model

- `games` — id, name, status (`setup | day1 | night | day2 | rescued | ended`), winner_team_id,
  created_at. Phase is set manually by the admin; no schedule config in v1
- `teams` — id, game_id, name (unique), access_code (unique, 6-char alphanumeric),
  member1_name, member2_name (both mandatory), created_at
- `locations` — id, game_id, order, name, type (`sighting | sos | final`), token (QR secret),
  word (sightings only), word_clue (contextual hint about the word's role in the final
  instruction), photo_url, clue_text, hint_text, unlocked_by (previous location)
- `scans` — id, team_id, location_id, scanned_at (unique per team+location; first wins)
- `answers` — id, team_id, kind (`bitchat_code | reconstruction | manual`), value, correct,
  submitted_at — drives the final gate; every attempt logged
- `broadcasts` — id, message, audience (`all | day1 | day2 | team:<id>`), created_at
- `settings` — single row: volunteer_phone, volunteer_whatsapp, instagram_url, bitchat_guide
- `audit_log` — actor (admin), action, target, timestamp (every admin intervention recorded,
  including Level 3 advances)

**No archive table.** `teams` + `scans` + `answers` + timestamps are the complete history;
"End event" exports them (CSV/JSON) and records the winner.

---

## 6. Game flow (the full journey)

**Opening (every device, first visit only, skippable after):**
1. Dark screen: radar/pookalam ping blinks at "MAVELLI TRACKER" for 3-5s -> **"NOT FOUND!"**
2. Warning: **"Warning: Mavelli is missing"**
3. CTA: **"Join the search!"** -> register or login

**Registration (on the spot, one phone per team):** leader enters team name + **both member names
(mandatory)** -> team created -> **access code** shown big with a copy button. Both members log in
from their own phones. Session persists per device.

**Team home (the hub):**
- Phase banner, current sighting photo + clue, sighting timeline
- **Evidence board**: the words collected so far in scan order, each with its small contextual
  clue. Words are never explained as "pieces of a final instruction" - that significance is
  discovered at the gate
- Live leaderboard link, hint state, **Contact volunteers** (call / WhatsApp)

**Day 1 (phase `day1`):**
1. Sighting 1 (Mapillary): clue directs teams to browse Mapillary. The Mapillary image contains
   a distinctive, identifiable landmark; teams interpret the image and locate sighting 2's spot.
2. Sightings 2-5: photo -> match to real spot -> find the **Mavelli evidence marker** there ->
   scan its QR -> **EVIDENCE RECOVERED** screen (word reveal + Mavelli line, see below) ->
   next photo auto-unlocks.
3. After sighting 5: instead of a next photo, the **Day 1 dead end**: "Mavelli has disappeared."
   No solution. The dead-end screen hints cryptically: "Mavelli has found a way to communicate
   without the internet. You'll need it tomorrow." with a small expandable **"BITCHAT - WHAT IS
   IT?"** button for teams that want to investigate. The Instagram Live does the full narrative
   explanation.
4. Hints: admin-pushed only (Level 1 of the stuck protocol).

**Night (phase `night`):** bridge page: Mavelli Instagram link, BitChat reminder, countdown to Day 2.

**Day 2 (phase `day2`):**
1. Team home shows the **search area** (e.g., a block). Teams reach it physically.
2. At the area they find the **MAVELLI EMERGENCY TRANSMISSION** poster ("If you've reached this
   place, you've found the signal.") with the SOS QR -> scan -> brief "signal locking" sequence ->
   full-screen **"MAVELLI SOS DETECTED"** alarm -> instruction: go to **BitChat**.
3. **BitChat step:** site links to BitChat + the account to message. Mavelli's message contains a
   **code** the team types into the site -> unlocks the **final hunt** clue (where Mavelli is).
   Admin fallback unlock exists if BitChat fails.
4. **Final gate:** at the final location, a **gate QR** -> the reconstruction puzzle: teams
   assemble the 5 words into the hidden instruction (exact order, derived from the contextual
   clues; instruction order differs from scan order). Correct reconstruction = team wins. First
   correct submission wins; others keep playing for placement.
5. Global "Mavelli rescued" state after the winner; hunt stays live.

**Scan result screen (the anti-mechanical moment):** scanning any sighting QR reveals
"EVIDENCE RECOVERED" with the word shown via a masked/blurred reveal, then a Mavelli line such as
"Mavelli was here. But where did he go next?" before the next sighting unlocks. The scan is a
story beat, not a token grab.

**Contact volunteers:** persistent option (banner/footer button) on team screens opens call /
WhatsApp to the volunteer numbers in `settings`. Zero friction for stuck teams (Level 2).

---

## 7. Stuck-team protocol (three levels)

| Level | Mechanism | Detail |
|---|---|---|
| 1 | **Hint** | Admin pushes a hint to a team; a small nudge appears on their sighting page. No auto-hints |
| 2 | **Volunteer** | Team uses Contact volunteers (call/WhatsApp). Volunteers follow a script: guide, never reveal answers; escalate to Level 3 if the team is genuinely stuck or physically lost |
| 3 | **Admin intervention** | Admin manually advances the team (unlock next stage / grant the word / trigger SOS / unlock final hunt). Every Level 3 action is audit-logged |

Purpose: keep volunteers from accidentally giving away answers and give admins a clean paper trail
of every intervention.

---

## 8. Physical props (organizer prep, standardized)

Teams must instantly recognize evidence. Standardized props, printed ahead:

- **Mavelli evidence markers #01-#05** (one per Day 1 sighting): a consistent board reading
  "MAVELLI EVIDENCE #0N - 'You found me.'" with the location QR. Same design everywhere so
  teams know they found the right thing
- **MAVELLI EMERGENCY TRANSMISSION poster** (Day 2 search area): "If you've reached this place,
  you've found the signal." + SOS QR. Deliberately different look from Day 1 markers
- **Final gate poster** (final location): gate QR only, no word
- The sighting page on the site tells teams what to look for: "Find the Mavelli evidence marker
  at this location."

QR codes are printed from the admin print sheet (black-on-white, min 2cm, A4).

---

## 9. Admin dashboard

One shared login. Desktop-friendly, mobile-usable for volunteers.

- **Phase control (manual only)** — SET DAY 1 / SET NIGHT / SET DAY 2 / END EVENT buttons with
  confirm dialogs. No scheduling engine. Content is gated by the current phase server-side.
- **Teams grid (live)** — team name, members, words collected, current stage, last activity;
  buttons: **advance/unlock**, **push hint**, **reset team**, **add team** (manual registration).
- **Submissions queue** — flagged answers to approve/reject (BitChat codes, reconstruction
  edge cases, manual corrections).
- **BitChat failure fallback** — one click to unlock the final hunt for a team whose BitChat broke.
- **Live leaderboard** — same ranking teams see, plus full list with timestamps.
- **QR print sheet** — print-ready sheet of all location QR codes; tokens re-generatable per game.
- **Broadcasts** — push a banner to all / phase / one team.
- **Restart game** (reset progress, keep teams) vs **New game** (wipe teams) vs **End event**
  (locks the game, records winner, exports teams/scans/answers data). Confirm dialogs.
- **Settings** — volunteer phone / WhatsApp numbers, Instagram URL, BitChat guide text.
- **Audit log** — every admin action, especially Level 3 interventions.

**Content loading (v1):** real content (photos, words, clues) is loaded directly into Supabase
via a seed script or direct DB edits - not through a dashboard editor. A content editor is a
stretch item, never a dependency.

---

## 10. Winner, leaderboard, end-event rules

- **Ranking (displayed order):**
  1. Finished teams, by completion timestamp (earliest first)
  2. Unfinished teams, by furthest stage (words collected / current location)
  3. Within a stage, latest relevant activity timestamp
- **Winner:** first team to submit the correct reconstruction at the final gate (earliest finish).
  Admin can set the winner manually as a fallback.
- **Abrupt end:** "End event" computes the ranking from live data (teams/scans/answers) and
  records the top team as winner.
- **End event:** phase -> `ended`, winner recorded, data exported. No snapshot machinery; the
  tables are already the record.

---

## 11. Reliability & anti-cheat

- No client-side secrets: words, clues, gate answer server-gated.
- QR tokens static; a shared QR screenshot grants only that one location; the gate needs all 5
  words in the correct reconstruction, so screenshots cannot win.
- Scan idempotency: first scan per team per location wins; repeats show "already found".
- Wrong reconstruction attempts: logged, no penalty, rate-limited.
- Offline tolerance: current stage + evidence board cached in localStorage; re-sync on reconnect.
  Mobile data backup.
- No polling anywhere: realtime push only. Battery-friendly.
- Scale: <100 concurrent phones; static pages cached; Supabase handles the rest.

---

## 12. Testing checklist

1. Blind walkthrough: register (2 names) -> Mapillary interpretation -> scan 5 markers ->
   dead end -> SOS poster scan -> BitChat code -> reconstruction gate (exact order) -> winner.
2. Reconstruction gate: wrong order rejected; clues actually sufficient to derive the order;
   attempt logging works.
3. QR edge cases: scan logged out (redirect back), scan twice (idempotent), both phones same
   team, foreign camera app without session.
4. Realtime: scan on phone A appears on phone B within seconds; evidence board + leaderboard update.
5. BitChat failure drill: admin unlocks final hunt manually; wrong code rejected.
6. Volunteer contact: call and WhatsApp links open correctly from a phone.
7. Stuck protocol drill: hint push, volunteer escalation, Level 3 advance + audit log entry.
8. Admin dry run: every button incl. phase control, restart vs new game, end event + export.
9. Load smoke test ~50 concurrent.
10. Props check: QR print sheet legibility, evidence marker and SOS poster placement at all sites.

---

## 13. One-day build plan (critical path)

| Hours | Milestone |
|---|---|
| 0-1 | Scaffold Next.js + Tailwind + Supabase; schema; seed 5 placeholder locations (word + word_clue) + settings |
| 1-3 | Intro ping sequence, "Join the search!" register/login, access code, team home + evidence board |
| 3-5 | Day 1 flow: sighting photo -> scan -> EVIDENCE RECOVERED reveal -> auto-unlock; realtime; leaderboard (new ranking) |
| 5-7 | Admin dashboard: login, manual phase buttons, teams grid + actions (3-level support), QR print sheet |
| 7-9 | Day 2: SOS poster scan + alarm, BitChat step + code check + admin fallback, reconstruction gate, winner/rescued; contact-volunteers buttons |
| 9-11 | Broadcasts, restart/new/end event + export, settings, mobile QA pass |
| 11-12 | Deploy to Vercel (`maveli-hunt.vercel.app`), load smoke test, one-team end-to-end dry run, print QRs + markers + posters |

**Stretch (only if time):** content editor in the dashboard, GPS geofence SOS as bonus trigger,
in-app QR scanner, schedule engine (auto phase flips), per-member activity view.

**Content (tomorrow, loaded via seed script / direct DB):** real photos, the 5 words + their
contextual clues (and the hidden instruction they form), schedule, volunteer phone/WhatsApp
numbers, Instagram handle, BitChat account details, Mapillary image choice.

---

## 14. Revisions from game-design feedback (v3 -> v4)

1. Final gate is now a **reconstruction puzzle**, not a copy job: words are fragments of a hidden
   instruction, each with a contextual clue; instruction order differs from scan order
2. Scans reveal **EVIDENCE RECOVERED** (masked word + Mavelli line), preserving the investigation
   feeling instead of a mechanical "word + unlock"
3. Standardized **physical evidence markers** (numbered, "You found me.") so teams recognize
   evidence on sight
4. Mapillary sighting requires **interpreting a landmark** in the image, not just finding it
5. BitChat is **hinted cryptically** on the dead-end screen with an optional explainer; the
   Instagram Live carries the narrative
6. Day 2 SOS is a distinct **EMERGENCY TRANSMISSION poster**, visually different from Day 1
7. Leaderboard ranking: finished teams by completion time, then unfinished by furthest stage
8. **No content editor** in v1; real content goes straight into Supabase (editor is stretch)
9. **No archive/snapshot system**; live tables + end-event export are the record
10. **No schedule engine**; manual SET DAY 1 / NIGHT / DAY 2 / END EVENT buttons
11. **Three-level stuck-team protocol** formalized (hint -> volunteer -> admin intervention)
