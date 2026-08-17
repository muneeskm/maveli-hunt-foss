/*
 * Client-side mode flag.
 *
 * Real mode is enabled by setting NEXT_PUBLIC_SUPABASE_URL at build time.
 * In real mode every data access goes through the Next.js API routes
 * (src/app/api/*), which use the SERVER-ONLY service-role key. The URL is
 * not secret (it is a public supabase.co endpoint) - it only acts as the
 * switch. Without it the app runs in demo mode (localStorage).
 *
 * The anon key is deliberately NOT used anymore: revoking anon access in the
 * database (schema.db M004) means even a leaked anon key is useless, and the
 * client bundle never contains answers or codes.
 */
export const realMode = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
