import type { SupabaseClient } from "@supabase/supabase-js";
import type { Inquiry, InquiryStatus, SendBriefInput } from "@/lib/types";

const STORAGE_KEY = "rollr_inquiries_v1";
export const INQUIRIES_CHANGED = "rollr:inquiries-changed";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readLocal(): Inquiry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Inquiry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(items: Inquiry[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(INQUIRIES_CHANGED));
}

function uid() {
  return `inq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function rowToInquiry(row: Record<string, unknown>): Inquiry {
  return {
    id: String(row.id),
    creator_id: String(row.creator_id),
    creator_name: String(row.creator_name || ""),
    client_name: String(row.client_name || ""),
    client_whatsapp: String(row.client_whatsapp || ""),
    client_email: (row.client_email as string) || undefined,
    brief_type: row.brief_type as Inquiry["brief_type"],
    event_date: String(row.event_date || ""),
    location: String(row.location || ""),
    category: String(row.category || ""),
    budget: (row.budget as string) || undefined,
    message: String(row.message || ""),
    status: (row.status as InquiryStatus) || "pending",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at || row.created_at),
  };
}

/** @deprecated local-only — prefer createInquiryRemote */
export function listInquiries(): Inquiry[] {
  return readLocal().sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function listInquiriesForCreator(creatorId: string): Inquiry[] {
  return listInquiries().filter((i) => i.creator_id === creatorId);
}

export function getInquiry(id: string): Inquiry | null {
  return readLocal().find((i) => i.id === id) ?? null;
}

/** Local fallback when Supabase unavailable */
export function createInquiry(input: SendBriefInput): Inquiry {
  const now = new Date().toISOString();
  const inquiry: Inquiry = {
    id: uid(),
    creator_id: input.creator_id,
    creator_name: input.creator_name,
    client_name: input.client_name.trim(),
    client_whatsapp: input.client_whatsapp.trim(),
    client_email: input.client_email?.trim() || undefined,
    brief_type: input.brief_type,
    event_date: input.event_date,
    location: input.location.trim(),
    category: input.category,
    budget: input.budget?.trim() || undefined,
    message: input.message.trim(),
    status: "pending",
    created_at: now,
    updated_at: now,
  };
  const all = readLocal();
  all.unshift(inquiry);
  writeLocal(all);
  return inquiry;
}

export function setInquiryStatus(
  id: string,
  status: Exclude<InquiryStatus, "pending">
): Inquiry | null {
  const all = readLocal();
  const idx = all.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const updated: Inquiry = {
    ...all[idx],
    status,
    updated_at: new Date().toISOString(),
  };
  all[idx] = updated;
  writeLocal(all);
  return updated;
}

export function countPending(): number {
  return readLocal().filter((i) => i.status === "pending").length;
}

/** Create brief in Supabase (visible to listing owner). Falls back to localStorage. */
export async function createInquiryRemote(
  supabase: SupabaseClient | null,
  input: SendBriefInput,
  clientUserId?: string | null
): Promise<{ inquiry?: Inquiry; error?: string; source: "supabase" | "local" }> {
  if (!supabase) {
    return { inquiry: createInquiry(input), source: "local" };
  }

  const payload = {
    creator_id: input.creator_id,
    creator_name: input.creator_name,
    client_name: input.client_name.trim(),
    client_whatsapp: input.client_whatsapp.trim(),
    client_email: input.client_email?.trim() || null,
    client_user_id: clientUserId || null,
    brief_type: input.brief_type,
    event_date: input.event_date || "",
    location: input.location.trim(),
    category: input.category,
    budget: input.budget?.trim() || null,
    message: input.message.trim(),
    status: "pending",
  };

  const { data, error } = await supabase
    .from("inquiries")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    const msg = error.message || "Failed to send brief";
    // FK fail if creator id not real uuid listing
    if (
      msg.includes("foreign key") ||
      msg.includes("creator_id") ||
      msg.toLowerCase().includes("relation") ||
      msg.toLowerCase().includes("does not exist")
    ) {
      // Local fallback for demo / missing migration
      const local = createInquiry(input);
      return {
        inquiry: local,
        error: `${msg} — brief saved locally only. Run 00007 if on live listings.`,
        source: "local",
      };
    }
    return { error: msg, source: "local" };
  }

  const inquiry = rowToInquiry(data as Record<string, unknown>);
  // Mirror to local so nav badge still works without login on same device
  const all = readLocal().filter((i) => i.id !== inquiry.id);
  all.unshift(inquiry);
  writeLocal(all);
  return { inquiry, source: "supabase" };
}

export async function fetchInquiriesForCreator(
  supabase: SupabaseClient,
  creatorListingId: string
): Promise<{ items: Inquiry[]; error?: string }> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("creator_id", creatorListingId)
    .order("created_at", { ascending: false });

  if (error) {
    return { items: listInquiriesForCreator(creatorListingId), error: error.message };
  }
  return { items: (data || []).map((r) => rowToInquiry(r as Record<string, unknown>)) };
}

/** Load all inquiries for the signed-in creator (any of their listing ids). */
export async function fetchMyInquiries(
  supabase: SupabaseClient,
  userId: string
): Promise<{ items: Inquiry[]; listingIds: string[]; error?: string }> {
  const { data: listings, error: listErr } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("profile_id", userId);

  if (listErr) {
    return { items: listInquiries(), listingIds: [], error: listErr.message };
  }

  const listingIds = (listings || []).map((l) => l.id as string);
  if (listingIds.length === 0) {
    return { items: listInquiries(), listingIds: [] };
  }

  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .in("creator_id", listingIds)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      items: listInquiries().filter((i) => listingIds.includes(i.creator_id)),
      listingIds,
      error: error.message,
    };
  }

  const items = (data || []).map((r) => rowToInquiry(r as Record<string, unknown>));
  return { items, listingIds };
}

export async function setInquiryStatusRemote(
  supabase: SupabaseClient | null,
  id: string,
  status: Exclude<InquiryStatus, "pending">
): Promise<{ inquiry?: Inquiry; error?: string }> {
  // Always update local mirror
  const local = setInquiryStatus(id, status);

  if (!supabase || id.startsWith("inq_")) {
    return local
      ? { inquiry: local }
      : { error: "Brief not found (local demo)." };
  }

  const { data, error } = await supabase
    .from("inquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return local
      ? { inquiry: local, error: error.message }
      : { error: error.message };
  }

  const inquiry = rowToInquiry(data as Record<string, unknown>);
  return { inquiry };
}

export function countPendingFrom(items: Inquiry[]): number {
  return items.filter((i) => i.status === "pending").length;
}
