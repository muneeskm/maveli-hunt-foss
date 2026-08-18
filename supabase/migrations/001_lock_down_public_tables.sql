-- ============================================================================
-- MIGRATION: 001_lock_down_public_tables.sql
-- FOSS Maveli Hunt - Database Privacy & Access Lockdown
-- ============================================================================
-- ARCHITECTURE:
--   Browser -> Next.js API Routes -> Server Privileged Client -> Postgres DB
--
-- Direct browser/client access via the anon key is completely prohibited.
-- All sensitive data (team codes, diff words, gate answer, BitChat codes,
-- admin credentials) is strictly mediated by server-side API routes.
-- ============================================================================

-- 1. Enable Row Level Security (RLS) on all application tables
do $$
declare
  tbl text;
begin
  foreach tbl in array array['games','teams','locations','scans','answers','hints','broadcasts','settings','audit_log']
  loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = tbl) then
      execute format('alter table public.%I enable row level security', tbl);
    end if;
  end loop;
end $$;

-- 2. Drop open/public policies on the nine application tables
-- (Targets only application tables; preserves Supabase auth/storage/internal policies)
do $$
declare
  tbl text;
  pol text;
begin
  foreach tbl in array array['games','teams','locations','scans','answers','hints','broadcasts','settings','audit_log']
  loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = tbl) then
      for pol in (
        select policyname
        from pg_policies
        where schemaname = 'public'
          and tablename = tbl
          and (
            roles::text[] && array['anon', 'authenticated', 'public']::text[]
            or policyname ilike '%open%'
            or policyname ilike '%teams%'
          )
      )
      loop
        execute format('drop policy if exists %I on public.%I', pol, tbl);
      end loop;
    end if;
  end loop;
end $$;

-- 3. Revoke all privileges on existing public schema objects from anon & authenticated
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all routines in schema public from anon, authenticated;

-- 4. Lock down DEFAULT PRIVILEGES to protect future tables/sequences/functions
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on routines from anon, authenticated;

-- 5. Explicitly grant required privileges to server-side service role
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines to service_role;
