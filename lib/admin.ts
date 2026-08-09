/**
 * Admin allowlist for waitlist / ops UI.
 * Set ADMIN_EMAILS or NEXT_PUBLIC_ADMIN_EMAILS (comma-separated) in env.
 * Example: you@gmail.com,partner@gmail.com
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
