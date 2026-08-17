-- FOSS Mavelli Hunt - Supabase schema
-- Run this in the Supabase SQL editor (or via the CLI) BEFORE seed.sql.
--
-- Security note: this is an event game, not user data. RLS is left open on
-- purpose (anyone with the anon key can read/write), which matches the
-- "no auth, access-code only" design. Answers live in the DB, never in the
-- client bundle. Tighten policies later if the game ever holds real data.

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  phase text not null default 'setup'
    check (phase in ('setup','day1','night','day2','rescued','ended')),
  winner_team_id uuid,
  gate_answer text[] not null default '{}',
  gate_slots text[] not null default '{}',
  started_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  member1 text not null,
  member2 text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.locations (
  id text primary key,
  ord int not null,
  type text not null check (type in ('sighting','sos','final')),
  name text not null,
  token text not null unique,
  word text not null default '',
  word_clue text not null default '',
  photo_url text not null default '',
  clue_text text not null default '',
  hint_text text not null default ''
);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  location_id text not null references public.locations(id) on delete cascade,
  at timestamptz not null default now(),
  unique (team_id, location_id)
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  kind text not null check (kind in ('bitchat','reconstruction','manual')),
  value text not null,
  correct boolean not null default false,
  at timestamptz not null default now()
);

create table if not exists public.hints (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  location_id text not null references public.locations(id) on delete cascade,
  at timestamptz not null default now()
);

create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  audience text not null default 'all'
    check (audience in ('all','day1','day2','team')),
  team_id uuid references public.teams(id) on delete cascade,
  at timestamptz not null default now()
);

create table if not exists public.settings (
  id int primary key default 1,
  volunteer_phone text not null default '',
  volunteer_whatsapp text not null default '',
  instagram_url text not null default '',
  bitchat_guide text not null default '',
  bitchat_code text not null default '',
  admin_code text not null default '',
  sos_lock_seconds int not null default 4,
  mapillary_note text not null default '',
  check (id = 1)
);

create table if not exists public.audit_log (
  id bigserial primary key,
  actor text not null,
  action text not null,
  target text not null default '',
  at timestamptz not null default now()
);

-- Event-open RLS (see security note above)
alter table public.games enable row level security;
alter table public.teams enable row level security;
alter table public.locations enable row level security;
alter table public.scans enable row level security;
alter table public.answers enable row level security;
alter table public.hints enable row level security;
alter table public.broadcasts enable row level security;
alter table public.settings enable row level security;
alter table public.audit_log enable row level security;

create policy "open read" on public.games for select using (true);
create policy "open write" on public.games for all using (true) with check (true);
create policy "open read" on public.teams for select using (true);
create policy "open write" on public.teams for all using (true) with check (true);
create policy "open read" on public.locations for select using (true);
create policy "open write" on public.locations for all using (true) with check (true);
create policy "open read" on public.scans for select using (true);
create policy "open write" on public.scans for all using (true) with check (true);
create policy "open read" on public.answers for select using (true);
create policy "open write" on public.answers for all using (true) with check (true);
create policy "open read" on public.hints for select using (true);
create policy "open write" on public.hints for all using (true) with check (true);
create policy "open read" on public.broadcasts for select using (true);
create policy "open write" on public.broadcasts for all using (true) with check (true);
create policy "open read" on public.settings for select using (true);
create policy "open write" on public.settings for all using (true) with check (true);
create policy "open read" on public.audit_log for select using (true);
create policy "open write" on public.audit_log for all using (true) with check (true);

-- realtime: push scans, answers, broadcasts, phase changes to clients
alter publication supabase_realtime add table public.scans;
alter publication supabase_realtime add table public.answers;
alter publication supabase_realtime add table public.broadcasts;
alter publication supabase_realtime add table public.games;
