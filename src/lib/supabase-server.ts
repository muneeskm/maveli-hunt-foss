import { createClient } from "@supabase/supabase-js";

/*
 * SERVER-ONLY Supabase client.
 *
 * Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY - NEVER expose the service
 * role key to the client (no NEXT_PUBLIC_ prefix; it must only exist in
 * server-side env: .env.local / Vercel project env vars). The service role
 * bypasses RLS, so this client is the ONLY path to the data.
 *
 * This file must never be imported from a client component.
 */

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const serverSupabase =
  url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

export function requireServerSupabase() {
  if (!serverSupabase) {
    throw new Error(
      "Supabase server env missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return serverSupabase;
}
