import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for App Router. Returns null when env is unset.
 * Swap to @supabase/ssr cookie helpers when auth is wired in a later phase.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
