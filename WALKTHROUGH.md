# FOSS Mavelli Hunt - Walkthrough

How to run, test end to end, point it at Supabase, and deploy on Vercel.

---

## 1. What this is

A mobile-first hunt tracker for the FOSS Mavelli Hunt event. Black + green +
white theme. Teams register with a name + 2 member names, get a 6-character
access code, and every member signs in with that code. Progress syncs in
real time (Supabase Realtime in production, localStorage in demo mode).

Flow:

- **Intro**: campus map, Mavelli's avatar wanders, signal goes unstable, then
  "WARNING: LOCATION NOT FOUND" overlay -> "Join the search".
- **Day 1**: 5 sightings. Each sighting shows a Mapillary view of a campus
  spot plus a modified copy of the image on the site. One word differs.
  Teams type the word to recover evidence (5 words -> evidence board).
- **Day 1 dead end**: trail stops, BitChat teased, Instagram live at night.
- **Day 2**: teams reach the search area, scan the SOS poster QR -> lock ->
  "MAVELLI SOS DETECTED" -> enter the code from Mavelli's BitChat message ->
  final hunt -> scan the final QR -> reconstruct the 5 words in exact order
  -> first team to do it wins.

---

## 2. Run locally (demo mode)

Demo mode needs no database. All data lives in `localStorage` per browser.

```bash
npm install
npm run dev          # http://localhost:3000
# or, for a production build:
npm run build && npm start
```

Useful scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build
```

Demo mode is single-device: state is stored in the browser, and two phones
share state only through the same browser profile. For real multi-phone
sync you need Supabase (section 5). Every page calls the same `store.*`
API, so demo and real mode behave identically.

To reset demo data: DevTools -> Application -> Local Storage ->
`http://localhost:3000` -> clear `mh:v1`, `mh:session`, `mh:admin`.

---

## 3. End-to-end test walkthrough

Do this once before the event. The placeholder content is:

- Admin code: `mavelli-admin`
- Day 1 words (in scan order): `TEMPLE`, `NORTH`, `THREE`, `BANYAN`, `CLOCK`
- Gate answer (exact order): `NORTH TEMPLE CLOCK BANYAN THREE`
- BitChat code: `MERIDIAN`
- SOS lock: 4 seconds

### 3.1 Intro + registration

1. Open the site on a phone-sized viewport. The campus map shows and
   Mavelli's avatar wanders across it. After ~9s the avatar blinks, then a
   "WARNING: LOCATION NOT FOUND" overlay covers the map. Tap to skip.
2. Second visit on the same phone skips the intro.
3. On "Join the search": register a team (name + 2 members). You should see
   the access code screen (6 chars, e.g. `9898A4`) with a copy button.
4. Tap "Continue to the tracker". You land on the tracker (standby:
   "The hunt begins soon") with the team badge and a locked evidence board.
5. Log out (header icon) and sign in with the same access code on the
   "Team code" tab. You get back into the same team.

### 3.2 Admin + phase control

1. Open `/admin`. Log in with `mavelli-admin`.
2. Overview shows stats (1 team, 0 scans). Tap "Day 1".
3. The tracker now shows "DAY 1 - TRACKING" and Sighting 01.

### 3.3 Day 1 - typed words (no QR for sightings)

1. Sighting 01 shows: clue, Mapillary panel with an "Open Mapillary view"
   button, the site's image copy, and a word input.
2. Type `TEMPLE` (placeholder word) -> "Verify word". The panel flips to
   "EVIDENCE RECOVERED" and the evidence board fills slot 01.
3. Wrong words show an inline error and are logged to the admin answers log.
4. Repeat for sightings 02-05 with `NORTH`, `THREE`, `BANYAN`, `CLOCK`.
   Each correct word auto-advances to the next sighting.
5. After all 5: "MAVELLI HAS DISAPPEARED" dead end, BitChat teaser.
6. Admin -> set "Night". The tracker now shows the Instagram live callout.

### 3.4 Day 2 - SOS, BitChat, final gate

1. Admin -> set "Day 2". Tracker shows the SOS search stage.
2. Visit `/scan/sos-delta` (simulates scanning the SOS poster QR). You see
   "SIGNAL LOCKING" for ~4s, then the "MAVELLI SOS DETECTED" alarm.
3. "Follow the SOS" -> tracker shows the BitChat step. Enter `MERIDIAN`.
   Wrong codes error inline. Correct code unlocks the final hunt.
4. Visit `/scan/fin-omega` (simulates the final marker QR). The gate opens:
   five slots. Enter the words in the exact instruction order:
   `NORTH`, `TEMPLE`, `CLOCK`, `BANYAN`, `THREE`.
5. Wrong order errors (5 fails = 30s lockout). Correct order shows
   "MAVELLI IS SAFE", sets the winner, and the leaderboard ranks the team 01.
6. Scanning the SOS QR again shows "SOS already received"; scanning the
   final QR again shows the gate directly.

### 3.5 Leaderboard + admin tools

1. `/leaderboard` ranks finished teams by completion time, then unfinished
   by furthest stage, then latest activity.
2. Admin -> Teams: expand a team -> push a Level 1 hint, grant a location
   (Level 3 advance), reset the team, call a volunteer.
3. Admin -> QR sheet: only the SOS + final QRs print (A4).
4. Admin -> Broadcast: send to everyone / Day 1 / Day 2 / one team. The
   broadcast bar appears on the tracker.
5. Admin -> Settings: volunteer phone, WhatsApp, Instagram, BitChat code,
   admin code, SOS lock seconds, BitChat guide, Mapillary note. Save persists.
6. Admin -> Danger: End event (locks leaderboard), Restart game (keeps
   teams, wipes progress), New game (wipes everything), Export JSON.

---

## 4. Real-event QR codes

The QR sheet in `/admin` encodes `{origin}/scan/{token}`. Printed at the
deployed origin, the QR opens the scan page on the team's phone. If the
phone has no session, it bounces to `/?scan=...` and returns after login.

Day 1 has NO QR codes: sightings unlock by typing the diff word.

---

## 5. Supabase setup (real multi-phone sync)

1. Create a free project at supabase.com.
2. SQL Editor -> paste the contents of **`schema.db`** -> Run. Safe to
   re-run; it is cumulative and idempotent.
3. Paste the contents of **`supabase/seed.sql`** -> Run.
4. Project Settings -> API: copy the project URL and the anon key.
5. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

6. Restart the dev server. The app now uses Supabase for teams, scans,
   answers, hints, broadcasts, phase, and settings, with Realtime pushing
   updates to every phone.

The Supabase-backed store is fully implemented (`src/lib/supabase-store.ts`,
behind the `store.*` seam in `src/lib/store.ts`). It mirrors the demo API 1:1
with an in-memory cache + Realtime subscriptions (scans, answers, hints,
broadcasts, teams, game, settings), optimistic writes, and server-enforced
first-scan-wins / first-winner-wins. When the env vars above are set, the app
is in real mode automatically; without them it falls back to demo mode.

Before the event, smoke-test real mode on two phones:

- Register a team on phone A, log in with the same code on phone B.
- Phone A solves a sighting -> phone B shows the evidence + unlock within ~1s.
- Two phones scanning the same SOS QR -> only one scan is recorded.
- Admin phase change -> team screens update everywhere without a refresh.
- Try `End event`, `Restart game` (keeps teams), and `New game` (wipes teams)
  on a throwaway project so you know exactly what each does to the data.

Known behaviors to expect:

- With a fresh Supabase project where `seed.sql` has NOT been run, the app
  bootstraps the games + settings rows itself and falls back to the built-in
  placeholder locations, so it never crashes - but run the seed anyway.
- Team names are not unique (two teams may share a name); access codes are
  unique and are what login uses.
- RLS is intentionally open (anyone with the anon key can read/write); the
  access code is the only gate, matching the no-auth design. Do not reuse
  the anon key for anything else.

---

## 6. Deploy on Vercel

1. Push this repo to GitHub.
2. vercel.com -> Add New Project -> import the repo.
3. Framework preset: Next.js (auto-detected). Keep the default build.
4. Environment variables (Settings -> Environment Variables):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

   (Optional for demo-mode-only testing: leave them empty. The site runs
   fully in localStorage mode without them.)
5. Deploy. Default domain will be like `maveli-hunt.vercel.app`.
6. **After deploying, re-print the QR sheet from the deployed admin** so the
   QR URLs point at the deployed origin, not localhost.

---

## 7. Pre-event content checklist

Replace placeholder content before the event. Most of it lives in
`supabase/seed.sql` (or `src/lib/seed.ts` for demo mode):

- [ ] 5 Mapillary views (`mapillary_url` per sighting) - real campus spots
- [ ] 5 modified images (`photo_url`) - the same spots with ONE word changed
- [ ] The 5 diff words + the gate answer order (`gate_answer`)
- [ ] Mavelli's avatar: `public/mavelli-avatar.png` (already the real icon)
- [ ] Tracker map art: `public/campus-map-art.png` (fictional campus map, 3:5
      portrait, 1080x1800px, dark theme + green accents to match the tracker
      - see the intro screen for exact placement)
- [ ] Club logo: `public/foss-logo.png` (shown on join + admin screens)
- [ ] BitChat code (`bitchat_code`) and BitChat guide text
- [ ] Volunteer phone + WhatsApp link
- [ ] Instagram URL (Mavelli's account)
- [ ] Admin code (change from `mavelli-admin`)
- [ ] SOS lock seconds (drama timing)
- [ ] SOS poster + final marker QRs printed from `/admin`
- [ ] Full run-through of every clue from a fresh team
