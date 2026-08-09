import type { SupabaseClient } from "@supabase/supabase-js";

export type WaitlistRole = "shoot" | "edit" | "both";
export type WaitlistStatus = "pending" | "contacted" | "approved" | "rejected";

export type WaitlistSignup = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: WaitlistRole;
  primary_category: string | null;
  notes: string | null;
  status: WaitlistStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WaitlistInput = {
  full_name: string;
  email: string;
  phone?: string;
  role: WaitlistRole;
  primary_category?: string;
  notes?: string;
};

export async function submitWaitlist(
  supabase: SupabaseClient,
  input: WaitlistInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const payload = {
    full_name: input.full_name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || null,
    role: input.role,
    primary_category: input.primary_category?.trim() || null,
    notes: input.notes?.trim() || null,
    status: "pending" as const,
  };

  if (!payload.full_name || !payload.email) {
    return { ok: false, error: "Name and email are required." };
  }

  const { data, error } = await supabase
    .from("waitlist_signups")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    const msg = error.message || "Could not save interest";
    if (
      msg.toLowerCase().includes("relation") ||
      msg.toLowerCase().includes("does not exist") ||
      msg.toLowerCase().includes("schema")
    ) {
      return {
        ok: false,
        error: `${msg} — run supabase/migrations/00007_waitlist_and_inquiries.sql`,
      };
    }
    return { ok: false, error: msg };
  }

  return { ok: true, id: data?.id as string };
}

export async function fetchWaitlist(
  supabase: SupabaseClient
): Promise<{ rows: WaitlistSignup[]; error?: string }> {
  const { data, error } = await supabase
    .from("waitlist_signups")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { rows: [], error: error.message };
  }
  return { rows: (data || []) as WaitlistSignup[] };
}

export async function updateWaitlistStatus(
  supabase: SupabaseClient,
  id: string,
  status: WaitlistStatus,
  adminNotes?: string
): Promise<{ ok: boolean; error?: string }> {
  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (adminNotes !== undefined) payload.admin_notes = adminNotes;

  const { error } = await supabase
    .from("waitlist_signups")
    .update(payload)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
