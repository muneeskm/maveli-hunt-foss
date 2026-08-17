# Mavelli Hunt — preview run doc

## Reproduce uncommitted artifacts

Nothing is generated from source at run time. The only uncommitted artifact a fresh
checkout needs is the environment file, which the main checkout keeps locally:

- Copy `.env` from the main checkout into this worktree (`cp <main>/.env ./.env`).
  It is gitignored and never committed. Values may need adapting per worktree
  (ports, etc.).

Note: `.env` currently holds the real Supabase URL + anon key, which flips the app
into **real mode** (server API routes need `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
to be set or they 500). For a local **demo-mode** preview, launch the server with
`NEXT_PUBLIC_SUPABASE_URL=` and `NEXT_PUBLIC_SUPABASE_ANON_KEY=` set to empty.

## Run the server

Dependencies: `npm install`. Then build and start:

```bash
npm run build
NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npx next start -p 3104
```

Detached (Linux), so it survives the conversation:

```bash
{ nohup env NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npx next start -p 3104 > /tmp/mavelli-server.log 2>&1 < /dev/null & echo "pid=$!"; disown; }
```

Confirm it is alive after ~5s and answers HTTP before registering the preview:

```bash
sleep 4; curl -s -o /dev/null -w "http=%{http_code}\n" http://127.0.0.1:3104/
```

The intro screen plays once per browser session (`sessionStorage`); returning phones
skip straight to "Join the search". To replay it, clear `mh:intro-seen` from
sessionStorage and reload.

The intro shows `public/campus-map-art.png` full-bleed with DOM overlays (sighting
dots, avatar wander, speech bubble, lost overlay); the whole sequence is ~3.7s
(2.4s wander + 0.3s blink + 1s lost overlay). No three.js, no video. Heavy repeated
re-renders in the preview tab can wedge the headless browser; a fresh tab recovers.
