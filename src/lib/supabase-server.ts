import { createClient } from "@supabase/supabase-js";

/*
 * SERVER-ONLY Supabase client.
 *
 * Uses SUPABASE_URL + (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY).
 * NEVER expose the service/secret key to the client (no NEXT_PUBLIC_ prefix;
 * it must only exist in server-side env: .env.local / Vercel project env vars).
 *
 * The privileged client bypasses RLS on Postgres, so this client is the
 * authoritative path to the database.
 *
 * This file must never be imported from a client component.
 */

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

export const serverSupabase =
  url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

export function requireServerSupabase() {
  if (!serverSupabase) {
    throw new Error(
      "Supabase server env missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY).",
    );
  }
  return serverSupabase;
}

