import { safeNextPath } from "@/lib/user-messages";

/**
 * Base origin used in Supabase emailRedirectTo (confirm email, magic link).
 *
 * Prefer NEXT_PUBLIC_SITE_URL on deployed hosts so confirm links never fall
 * back to a wrong preview origin. On localhost, keep the current origin so
 * local auth still works.
 */
export function getAuthEmailRedirectOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
  if (typeof window === "undefined") {
    return configured || "https://rollrgigs.vercel.app";
  }

  const origin = window.location.origin.replace(/\/$/, "");
  const isLocal =
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    origin.startsWith("http://192.168.");

  if (isLocal) return origin;
  return configured || origin;
}

/**
 * Where Supabase sends users after they click confirm / magic link.
 * Prefer /auth/confirm (client + server capable). /auth/callback still works
 * for older emails and OAuth-style ?code= exchanges.
 */
export function getAuthCallbackUrl(next = "/"): string {
  const base = getAuthEmailRedirectOrigin();
  const path = safeNextPath(next, "/");
  // Client confirm page handles code, token_hash, and hash fragments reliably
  return `${base}/auth/confirm?next=${encodeURIComponent(path)}`;
}
