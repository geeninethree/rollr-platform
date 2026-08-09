/**
 * Admin allowlist for waitlist / ops UI.
 * Prefer profiles.is_admin (migration 00008). Fallback: NEXT_PUBLIC_ADMIN_EMAILS.
 */
export function getAdminEmails(): string[] {
  const raw =
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = getAdminEmails();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}

/** Check admin via email allowlist OR profiles.is_admin from Supabase */
export async function checkIsAdmin(input: {
  email: string | null | undefined;
  isAdminFlag?: boolean | null;
}): Promise<boolean> {
  if (input.isAdminFlag === true) return true;
  return isAdminEmail(input.email);
}
