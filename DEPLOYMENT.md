# FOSS Mavelli Hunt - Deployment Guide

Everything you need to take this app from local dev to a live, event-ready site on
Vercel + Supabase, including the full test plan. All services used are free-tier.

---

## 0. What you are deploying

- **Next.js 15 app** (mobile-first, black/green/white theme) - the team tracker,
  admin dashboard, leaderboard, and QR scan flows.
- **Supabase (Postgres)** - the only database. Holds teams, locations, answers,
  game state, and settings.
- **Vercel** - hosts the Next.js app.

### How the app talks to the database (read this once)

The client bundle NEVER talks to Supabase directly. Every read/write goes through
Next.js API routes (`src/app/api/*`), which use the **service role key on the
server only**. Answers (diff words, gate answer, BitChat code, admin code) exist
only in the database and are never shipped in the client bundle or in API
responses. Anon access to Supabase is fully revoked (schema.db M004), so even a
leaked anon key is useless.

The env var `NEXT_PUBLIC_SUPABASE_URL` is ONLY a build-time mode switch:

- **Set** (non-empty) -> the app runs in **real mode** (Supabase + multi-phone sync).
- **Unset** (empty) -> **demo mode** (localStorage, single browser, no backend).

---

## 1. Prerequisites (accounts)

| Service | What for | Free tier |
|---|---|---|
| [supabase.com](https://supabase.com) | Database | 500 MB, enough for this event |
| [vercel.com](https://vercel.com) | Hosting | Hobby plan is fine |
| GitHub | Repo import | free |

Local tooling: Node 18+ (`node -v`), npm. Nothing else.

---

## 2. Supabase setup (one-time, ~10 min)

1. Create a project at supabase.com (pick a region close to Kerala, e.g.
   Singapore). Note the database password somewhere safe.
2. Open **SQL Editor** in the Supabase dashboard.
3. Paste the ENTIRE contents of **`schema.db`** (repo root) and Run.
   - This file is cumulative + idempotent: safe to re-run any number of times.
   - It creates all tables and (in M004) revokes ALL access from the anon role,
     so only the service role can touch the data.
4. Paste the ENTIRE contents of **`supabase/seed.sql`** and Run.
   - Loads placeholder content (5 diff-word sightings, SOS + final locations,
     gate answer, BitChat code, admin code, volunteer numbers).
   - Also idempotent. Replace the placeholders with real content before the
     event (Section 6).
5. Go to **Project Settings -> API** and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`) - not secret.
   - **Service role key** (`service_role`) - THIS IS SECRET. Never share it,
     never prefix it with `NEXT_PUBLIC_`, never commit it.

> If you ever need to change the database later: append a new numbered block
> (M005, M006...) at the bottom of `schema.db` with `IF NOT EXISTS` guards, then
> re-run the whole file. Never edit an old block.

---

## 3. Local testing (before deploying)

### 3.1 Demo mode (no database needed)

```bash
npm install
npm run dev        # http://localhost:3000
```

Demo mode stores everything in localStorage of one browser. Great for clicking
through the whole flow quickly. To reset: DevTools -> Application -> Local
Storage -> `http://localhost:3000` -> clear `mh:v1`, `mh:session`, `mh:admin`.

### 3.2 Real mode (against your Supabase project)

Create `.env.local` in the repo root:

```env
# mode switch (public, build-time)
NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co

# server-only secrets - NEVER prefix with NEXT_PUBLIC_, NEVER commit
SUPABASE_URL=https://YOURPROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Then:

```bash
npm run typecheck   # must pass
npm run build       # must pass
npm start           # http://localhost:3000
```

`.env.local` is gitignored - it will never be committed. Use this same project
for local real-mode testing; the deployed app can share it.

---

## 4. Deploy on Vercel

1. Push this repo to GitHub.
2. vercel.com -> **Add New Project** -> import the repo.
3. Framework preset: **Next.js** (auto-detected). Keep default build settings
   (build command `next build`, output dir `.next`).
4. **Environment Variables** (Settings -> Environment Variables, apply to
   Production AND Preview):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOURPROJECT.supabase.co
   SUPABASE_URL=https://YOURPROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
   ```

   - `NEXT_PUBLIC_` vars are baked into the client at build time - the URL is
     public and harmless.
   - `SUPABASE_SERVICE_ROLE_KEY` must stay server-only. Never add a
     `NEXT_PUBLIC_` prefix.
5. Click **Deploy**. You get a default domain like `maveli-hunt.vercel.app`.
6. **Custom domain (optional, recommended):** Settings -> Domains ->
   `maveli-hunt.vercel.app` -> add your own like `hunt.yourclub.in`, point the
   DNS CNAME at `cname.vercel-dns.com`.
7. **After deploying, re-print the QR sheet from the DEPLOYED admin** (see
   Section 7) so the QR URLs point at the live origin, not localhost.

### Redeploying after a change

Just push to the connected branch - Vercel rebuilds automatically. Or use
`vercel --prod` from the CLI. A redeploy is required whenever
`NEXT_PUBLIC_SUPABASE_URL` changes (it is baked in at build time); server-only
env var changes need a redeploy too.

---

## 5. Verify the deployed build leaks nothing

Answers must never appear in the client bundle. After building with real-mode
env vars, run:

```bash
grep -rl -E "TEMPLE|MERIDIAN|mavelli-admin|BANYAN" .next/static 2>/dev/null | head
# -> NO OUTPUT expected. Any match = a leak; fix before deploying.
```

Same check against the deployed site's JS (open the deployed page, find its
`/_next/static/chunks/*.js` files, download and grep). It must come back empty.

---

## 6. Pre-event content checklist

All of this is placeholder until you replace it. Real mode reads everything from
`supabase/seed.sql`; demo mode reads answers from `src/lib/demo-content.ts`.

- [ ] 5 Mapillary views (`mapillary_url` per sighting) - real campus spots
- [ ] 5 modified images (`photo_url`) - the same spots with ONE word changed
      (e.g. "...Engineering" -> "...Engineering (Autonomous)", answer: AUTONOMOUS)
- [ ] The 5 diff words + the final gate answer order (`gate_answer`)
- [ ] Mavelli's avatar: `public/mavelli-avatar.png` (already the real icon)
- [ ] Campus map art: `public/campus-map-art.png` (accurate pixel map, portrait,
      dark theme + green accents; shown full-bleed in the ~3.7s intro)
- [ ] Club logo: `public/foss-logo.png`
- [ ] BitChat code (`bitchat_code`) + BitChat guide text
- [ ] Volunteer phone + WhatsApp link (`settings`)
- [ ] Instagram URL (Mavelli's account)
- [ ] Admin code - change from `mavelli-admin`
- [ ] SOS lock seconds (drama timing; placeholder 4s)
- [ ] SOS poster + final marker QRs printed from the DEPLOYED admin

---

## 7. Print the QR codes (after deploying!)

The QR sheet lives at `/admin` (Admin -> QR sheet). It encodes
`{origin}/scan/{token}` for exactly two locations:

- SOS poster QR -> `https://<origin>/scan/sos-delta`
- Final marker QR -> `https://<origin>/scan/fin-omega`

**Print this from the deployed admin**, after the custom domain is live. If the
phone scanning has no session it bounces to `/?scan=...` and returns to the scan
after the team logs in, so the QRs work for walk-in teams too.

Day 1 has NO QR codes - sightings unlock by typing the diff word.

---

## 8. Full test plan

Run these against the DEPLOYED site (phone-sized viewport in DevTools, or a real
phone). Placeholder test data:

- Admin code: `mavelli-admin`
- Day 1 words (in order): `TEMPLE`, `NORTH`, `THREE`, `BANYAN`, `CLOCK`
- Gate answer (exact order): `NORTH TEMPLE CLOCK BANYAN THREE`
- BitChat code: `MERIDIAN`
- SOS lock: 4s, gate lockout: 5 fails -> 60s

### 8.1 Intro + registration

1. Open the site fresh. The ~3.7s intro plays: map art, pulsing sighting dots,
   avatar wander (2.4s), signal blink (0.3s), "WARNING: LOCATION NOT FOUND"
   overlay (1s), then "Join the search". Tap the overlay to skip.
2. Reload - the intro is skipped (session remembers). Clear sessionStorage
   (`mh:intro-seen`) to see it again.
3. Register a team: name + 2 member names (both mandatory). You get a
   6-character access code with a copy button.
4. "Continue to the tracker" -> standby screen ("The hunt begins soon") with
   team badge + locked evidence board.
5. Log out, sign back in with the code on the "Team code" tab -> same team.

### 8.2 Admin + phase control

1. Open `/admin`, log in with `mavelli-admin`.
2. Overview shows the team. Tap "Day 1" -> tracker shows "DAY 1 - TRACKING".

### 8.3 Day 1 - typed diff words

1. Sighting 01: clue, "Open Mapillary view" button, the site's modified image
   copy, word input.
2. Type `TEMPLE` -> verify -> "EVIDENCE RECOVERED", evidence board fills slot 01.
3. Type a wrong word -> inline error (also logged in admin answers log).
4. Repeat with `NORTH`, `THREE`, `BANYAN`, `CLOCK` (auto-advances).
5. After all 5: "MAVELLI HAS DISAPPEARED" dead end + BitChat teaser.
6. Admin -> set "Night" -> tracker shows the Instagram live callout.

### 8.4 Day 2 - SOS, BitChat, final gate

1. Admin -> set "Day 2". Tracker shows the SOS search stage.
2. Visit `/scan/sos-delta`. "SIGNAL LOCKING" for ~4s -> "MAVELLI SOS DETECTED".
3. "Follow the SOS" -> BitChat step. Enter `MERIDIAN` (wrong code errors
   inline). Correct unlocks the final hunt.
4. Visit `/scan/fin-omega`. The gate opens: five slots. Enter
   `NORTH TEMPLE CLOCK BANYAN THREE` in EXACT order.
5. Wrong order errors (5 fails = 60s lockout). Correct order -> "MAVELLI IS
   SAFE", winner set, leaderboard ranks the team 01.
6. Scanning the SOS QR again -> "SOS already received". Scanning the final QR
   again -> gate directly.

### 8.5 Leaderboard + admin tools

1. `/leaderboard`: finished teams ranked by completion time, unfinished by
   furthest stage, then latest activity.
2. Admin -> Teams: expand a team -> Level 1 hint, Level 3 advance (grant a
   location), reset team, call volunteer.
3. Admin -> QR sheet: only SOS + final QRs print (A4).
4. Admin -> Broadcast: all / Day 1 / Day 2 / one team; bar appears on tracker.
5. Admin -> Settings: volunteer phone, WhatsApp, Instagram, BitChat code, admin
   code, SOS lock seconds, BitChat guide, Mapillary note - save persists.
6. Admin -> Danger: End event (locks leaderboard), Restart game (keeps teams,
   wipes progress), New game (wipes everything), Export JSON.

### 8.6 Two-phone sync test (critical - do before the event)

1. Register a team on phone A; sign in with the same code on phone B.
2. Phone A solves a sighting -> phone B shows the word + next unlock within
   ~5s (one 4s poll interval).
3. Both phones scan the same SOS QR -> only ONE scan recorded.
4. Admin changes phase -> both team screens update within ~5s.
5. Wrong gate answers 5 times -> gate locks 60s on EVERY phone (server-side).
6. Try `End event`, `Restart game` (keeps teams), `New game` (wipes teams) on a
   throwaway project so you know exactly what each does.
7. Open the site from a phone on mobile data (not wifi) - confirm it loads and
   syncs. Mobile data will be the event-day fallback.

### 8.7 Security checks

1. `grep` the deployed JS for any placeholder answers (Section 5) - empty.
2. Log out of the app, open the site with the `?scan=sos-delta` param - it
   bounces to join, then returns to the scan after login.
3. Try `/api/team/state` unauthenticated - must error, not return team data.
4. Confirm the admin panel is not reachable without the admin code.

### 8.8 Event-day dry run

- Print QRs and tape them where the posters will be (or scan from the admin
  screen).
- One full run-through of every clue from a freshly-registered team, with a
  volunteer phone on standby and WhatsApp link working.

---

## 9. Event-day operations (admin playbook)

| Situation | Action |
|---|---|
| Team stuck on a clue | Admin -> Teams -> team -> push Level 1 hint |
| Still stuck | Team calls/WhatsApps a volunteer (contact button in app) |
| Must move a team forward | Admin -> Teams -> team -> grant location (Level 3) |
| Wrong team progress / duplicate | Reset team from Admin -> Teams |
| Need to change content mid-event | Edit `supabase/seed.sql` values directly in SQL Editor (or Settings) |
| Day 1 ends | Admin -> set "Night" (Instagram live callout) |
| Day 2 starts | Admin -> set "Day 2" |
| Winner found | Gate auto-sets; leaderboard locks on "End event" |
| Everything goes wrong | "Restart game" (keeps teams) or "New game" (wipes all) |
| Disputes / tiebreak | Archive = Export JSON + audit log in the DB |

---

## 10. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| App shows "Join the search" with no real data | `NEXT_PUBLIC_SUPABASE_URL` unset -> demo mode. Set it and redeploy. |
| API routes 500 in real mode | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` missing or wrong on the server. Check Vercel env vars, redeploy. |
| Login code rejected for a real team | Team wiped by New game, or DB was reseeded. Check Admin -> Teams. |
| QR scan opens the app but not the scan | Printed QR encodes localhost. Re-print from the deployed admin. |
| Changes to words/codes not reflected | Content is read from the DB, but a redeploy may be needed if you changed seed.sql. Verify in Admin -> Settings. |
| Realtime lag | Sync is a 4s poll per phone, not push. Up to ~5s delay is expected. |
| Intro replays | `mh:intro-seen` sessionStorage cleared, or a new device/browser. |

---

## 11. Files that matter for deployment

| File | Role |
|---|---|
| `schema.db` | Canonical, idempotent DB schema - paste into Supabase SQL Editor |
| `supabase/seed.sql` | Placeholder content - paste after schema.db, replace before event |
| `.env.example` | Documents all env vars (read it) |
| `next.config.ts` | Security headers (nosniff, X-Frame-Options, permissions) |
| `public/campus-map-art.png` | Intro map (portrait, dark + green) |
| `public/mavelli-avatar.png`, `public/foss-logo.png` | Brand assets |
| `src/lib/mode.ts` | Real/demo mode switch |
| `WALKTHROUGH.md` | Full game-flow walkthrough (complements this guide) |
