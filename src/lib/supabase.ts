import { createClient } from "@supabase/supabase-js";

/*
 * Real-mode bootstrap. Set NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY to switch the app off the localStorage demo
 * store (lib/store.ts) and onto Supabase for real multi-device + realtime.
 *
 * The demo store (lib/store.ts) is the single seam: every page calls `store.*`.
 * The Supabase-backed implementation mirrors those methods against the tables
 * in schema.db (repo root) and subscribes to realtime channels for scans,
 * answers, broadcasts, and phase changes.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

export const supabaseMode = Boolean(url && key);
