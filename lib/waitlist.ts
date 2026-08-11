import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Waitlist tracks:
 * - shoot | edit | both → creators (₹299 listing)
 * - recruiter → multi-job board interest (₹399)
 * - hire → general hiring interest (optional)
 */
export type WaitlistRole =
  | "shoot"
  | "edit"
  | "both"
  | "recruiter"
  | "hire";

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

export function waitlistRoleLabel(role: string): string {
  switch (role) {
    case "shoot":
      return "Photographer";
    case "edit":
      return "Editor";
    case "both":
      return "Photographer + editor";
    case "recruiter":
      return "Recruiter (multi-job · ₹399)";
    case "hire":
      return "Client / hiring";
    default:
      return role;
  }
}

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
    if (msg.includes("RATE_LIMIT")) {
      return {
        ok: false,
        error: "Too many attempts from this email. Please try again in an hour.",
      };
    }
    if (
      msg.toLowerCase().includes("relation") ||
      msg.toLowerCase().includes("does not exist") ||
      msg.toLowerCase().includes("schema") ||
      msg.toLowerCase().includes("check")
    ) {
      return {
        ok: false,
        error: `${msg} — run migrations 00007, 00010, and 00014 if missing`,
      };
    }
    return { ok: false, error: msg };
  }

  // Notify admin(s) if Resend + ADMIN_EMAILS configured
  await notifyAdminsOfWaitlist({
    full_name: payload.full_name,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
    primary_category: payload.primary_category,
    notes: payload.notes,
  });

  return { ok: true, id: data?.id as string };
}

/** Browser → API route; server → sendEmail directly */
async function notifyAdminsOfWaitlist(payload: {
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  primary_category: string | null;
  notes: string | null;
}) {
  try {
    if (typeof window !== "undefined") {
      void fetch("/api/notify/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => undefined);
      return;
    }

    // Server component / server action path
    const { getNotifyAdminEmails, sendEmail, waitlistAdminEmail } =
      await import("@/lib/email");
    const admins = getNotifyAdminEmails();
    if (admins.length === 0) return;

    const site =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "https://rollr-platform-gig.vercel.app";
    const mail = waitlistAdminEmail({
      fullName: payload.full_name,
      email: payload.email,
      phone: payload.phone || undefined,
      role: payload.role,
      primaryCategory: payload.primary_category || undefined,
      notes: payload.notes || undefined,
      adminUrl: `${site}/admin`,
    });
    await sendEmail({
      to: admins,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  } catch {
    /* never block waitlist save on notify failure */
  }
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

/**
 * When admin approves a recruiter waitlist row, activate multi-job on matching profile.
 */
export async function activateRecruiterByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();
  // Match case-insensitively (profiles.email may not be lowercased)
  const { data, error } = await supabase
    .from("profiles")
    .update({
      role: "recruiter",
      recruiter_sub_status: "active",
      updated_at: new Date().toISOString(),
    })
    .ilike("email", normalized)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) {
    return {
      ok: false,
      error:
        "No account with that email yet — mark waitlist approved and invite them to sign up as recruiter.",
    };
  }
  return { ok: true };
}
