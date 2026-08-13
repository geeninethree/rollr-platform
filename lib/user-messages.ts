/**
 * Map raw backend / storage / auth errors to short, non-technical copy.
 * Log the original message in the console for debugging.
 */

const KIND_LABEL: Record<string, string> = {
  avatar: "profile photo",
  cover: "cover image",
  work: "portfolio image",
};

export function kindLabel(kind: string): string {
  return KIND_LABEL[kind] || "image";
}

export function maxMbForKind(kind: "avatar" | "cover" | "work"): number {
  if (kind === "avatar") return 5;
  if (kind === "cover") return 8;
  return 10;
}

/** Safe path for post-auth redirects (no open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export function humanizeAuthError(raw: string | null | undefined): string {
  const msg = (raw || "").trim();
  if (!msg) return "Something went wrong. Please try again.";
  const lower = msg.toLowerCase();

  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("wrong password")
  ) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Please confirm your email first — check your inbox (and spam), then try again.";
  }
  if (
    lower.includes("otp_expired") ||
    lower.includes("otp expired") ||
    lower.includes("token has expired") ||
    lower.includes("link is invalid or has expired") ||
    lower.includes("expired")
  ) {
    return "This link has expired. Request a new confirmation email from the sign-in page.";
  }
  if (
    lower.includes("access_denied") ||
    lower.includes("invalid token") ||
    lower.includes("token not found")
  ) {
    return "This link is invalid. Request a new one from the sign-in page.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (lower.includes("password") && (lower.includes("least") || lower.includes("short"))) {
    return "Password must be at least 6 characters.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch failed")) {
    return "Couldn’t reach the server. Check your connection and try again.";
  }
  // Never leak config / migration hints
  if (
    lower.includes("supabase") ||
    lower.includes("migration") ||
    lower.includes("jwt") ||
    lower.includes("api key")
  ) {
    return "We’re having trouble signing you in. Please try again in a moment.";
  }
  // Cap length of unknown vendor messages
  if (msg.length > 140) return "Something went wrong. Please try again.";
  return msg;
}

export function humanizeUploadError(
  raw: string | null | undefined,
  kind?: string
): string {
  const msg = (raw || "").trim();
  const label = kind ? kindLabel(kind) : "image";
  if (!msg) return `Couldn’t upload your ${label}. Try again.`;

  const lower = msg.toLowerCase();

  if (lower.includes("too large") || lower.includes("maximum") || lower.includes("payload")) {
    return msg.includes("MB")
      ? msg
      : `This ${label} is too large. Try a smaller file or compress it.`;
  }
  if (
    lower.includes("heic") ||
    lower.includes("heif") ||
    lower.includes("not supported") ||
    lower.includes("mime")
  ) {
    return "This image format isn’t supported. Use JPG, PNG, or WebP.";
  }
  if (
    lower.includes("bucket") ||
    lower.includes("row-level security") ||
    lower.includes("rls") ||
    lower.includes("not found") ||
    lower.includes("policy") ||
    lower.includes("permission") ||
    lower.includes("unauthorized") ||
    lower.includes("jwt")
  ) {
    return `Couldn’t upload your ${label}. Please try again, or use a smaller JPG/PNG.`;
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Upload failed — check your connection and try again.";
  }
  if (msg.length > 120) return `Couldn’t upload your ${label}. Try a smaller JPG or PNG.`;
  return msg;
}

export function humanizeSaveError(raw: string | null | undefined): string {
  const msg = (raw || "").trim();
  if (!msg) return "Couldn’t save. Please try again.";
  const lower = msg.toLowerCase();
  if (
    lower.includes("column") ||
    lower.includes("schema") ||
    lower.includes("migration") ||
    lower.includes("supabase") ||
    lower.includes("relation") ||
    lower.includes("does not exist")
  ) {
    if (typeof console !== "undefined") {
      console.warn("[rollr] save error:", msg);
    }
    return "Couldn’t save your listing right now. Please try again in a moment.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network error — check your connection and try again.";
  }
  if (msg.length > 140) return "Couldn’t save. Please try again.";
  return msg;
}

export function listingStatusLabel(status: string): string {
  switch (status) {
    case "published":
      return "Live";
    case "pending_review":
      return "Pending review";
    case "rejected":
      return "Needs changes";
    case "draft":
      return "Draft";
    default:
      return status.replace(/_/g, " ");
  }
}

export function connectionErrorMessage(): string {
  return "We’re having trouble connecting. Please try again in a moment.";
}
