/**
 * Admin access.
 * Real data access is enforced by profiles.is_admin (RLS).
 * Email allowlist is SERVER-ONLY (ADMIN_EMAILS) — never trust browser for ops.
 */

/** Server-side admin emails for notify + optional soft checks. Empty in browser. */
export function getAdminEmails(): string[] {
  // Never expose allowlist logic via public env in the client bundle path
  if (typeof window !== "undefined") return [];

  // Server-only. Never use NEXT_PUBLIC_* for admin allowlist (ships to browser).
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (typeof window !== "undefined") return false;
  const list = getAdminEmails();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}

/**
 * Admin UI gate: prefer DB flag.
 * Browser: ONLY profiles.is_admin (email allowlist does nothing client-side).
 * Server: is_admin OR ADMIN_EMAILS match.
 */
export async function checkIsAdmin(input: {
  email: string | null | undefined;
  isAdminFlag?: boolean | null;
}): Promise<boolean> {
  if (input.isAdminFlag === true) return true;
  if (typeof window !== "undefined") return false;
  return isAdminEmail(input.email);
}
