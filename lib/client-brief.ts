/**
 * Saved client brief defaults (browser localStorage).
 * Autofills Send brief forms so clients don't retype every time.
 */

export type SavedClientBrief = {
  client_name: string;
  client_whatsapp: string;
  client_email: string;
  /** Preferred default location when creator has no preference */
  location: string;
  budget: string;
  /** Reusable project notes — still editable per creator */
  message: string;
  /** Last event date used (optional) */
  event_date: string;
  updated_at: string;
};

const STORAGE_KEY = "rollr_client_brief_v1";
export const CLIENT_BRIEF_CHANGED = "rollr:client-brief-changed";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getSavedClientBrief(): SavedClientBrief | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedClientBrief;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveClientBrief(
  partial: Omit<SavedClientBrief, "updated_at">
): SavedClientBrief {
  const next: SavedClientBrief = {
    client_name: partial.client_name.trim(),
    client_whatsapp: partial.client_whatsapp.trim(),
    client_email: partial.client_email.trim(),
    location: partial.location.trim(),
    budget: partial.budget.trim(),
    message: partial.message.trim(),
    event_date: partial.event_date,
    updated_at: new Date().toISOString(),
  };
  if (canUseStorage()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CLIENT_BRIEF_CHANGED));
  }
  return next;
}

export function clearSavedClientBrief() {
  if (!canUseStorage()) return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CLIENT_BRIEF_CHANGED));
}

export function hasSavedClientBrief() {
  const s = getSavedClientBrief();
  return Boolean(s?.client_name && s?.client_whatsapp);
}
