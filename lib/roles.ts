import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types";
import { submitWaitlist } from "@/lib/waitlist";

/**
 * Alpha: one primary role per profile.
 * - client: hire / post 1 free open job
 * - creator: portfolio + pitch jobs
 * - recruiter: multi-job board (₹399 when live; waitlist until activated)
 */

export async function setProfileRole(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole,
  extras?: { full_name?: string }
): Promise<{ ok: boolean; error?: string }> {
  const payload: Record<string, unknown> = {
    role,
    updated_at: new Date().toISOString(),
  };
  if (extras?.full_name?.trim()) {
    payload.full_name = extras.full_name.trim();
  }

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);

  if (error) {
    const msg = error.message || "Could not update role";
    console.warn("[rollr] setProfileRole:", msg);
    if (msg.includes("invalid input value for enum") || msg.includes("recruiter")) {
      return {
        ok: false,
        error: "Couldn’t update your account type. Please try again later.",
      };
    }
    return {
      ok: false,
      error: msg.length > 120 ? "Couldn’t update your account. Try again." : msg,
    };
  }
  return { ok: true };
}

/**
 * Become a recruiter (role) + join multi-job waitlist.
 * Does not auto-activate multi-job (recruiter_sub_status stays inactive
 * unless already active).
 */
export async function claimRecruiterPath(
  supabase: SupabaseClient,
  userId: string,
  opts?: { full_name?: string; notes?: string }
): Promise<{ ok: boolean; waitlisted?: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { ok: false, error: "Not signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, recruiter_sub_status")
    .eq("id", userId)
    .maybeSingle();

  const email = (profile?.email || user.email || "").trim().toLowerCase();
  const fullName =
    opts?.full_name?.trim() ||
    profile?.full_name ||
    (user.user_metadata?.full_name as string) ||
    email.split("@")[0] ||
    "Recruiter";

  if (!profile) {
    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      email: email || `${userId}@unknown.local`,
      role: "recruiter",
      recruiter_sub_status: "inactive",
    });
    if (upsertError) {
      return { ok: false, error: upsertError.message };
    }
  } else {
    // Keep multi-job if already activated; only flip role
    const alreadyActive = profile.recruiter_sub_status === "active";
    const { error } = await supabase
      .from("profiles")
      .update({
        role: "recruiter",
        full_name: fullName,
        ...(alreadyActive ? {} : { recruiter_sub_status: "inactive" }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error) {
      console.warn("[rollr] claimRecruiterPath:", error.message);
      return {
        ok: false,
        error:
          error.message.includes("enum") || error.message.includes("recruiter")
            ? "Couldn’t set recruiter access. Please try again later."
            : error.message.length > 120
              ? "Couldn’t join the waitlist. Try again."
              : error.message,
      };
    }
  }

  // Already multi-job active — no waitlist needed
  if (profile?.recruiter_sub_status === "active") {
    return { ok: true, waitlisted: false };
  }

  if (!email) {
    return {
      ok: true,
      waitlisted: false,
      error: "Role set to recruiter, but no email for waitlist.",
    };
  }

  const wl = await submitWaitlist(supabase, {
    full_name: fullName,
    email,
    role: "recruiter",
    primary_category: "Multi-job board",
    notes:
      opts?.notes ||
      "Recruiter path claimed — multi-job (₹399) pending activation",
  });

  // Duplicate email is fine — still on the list
  if (!wl.ok) {
    const soft =
      wl.error?.toLowerCase().includes("duplicate") ||
      wl.error?.toLowerCase().includes("unique");
    if (soft) return { ok: true, waitlisted: true };
    return {
      ok: true,
      waitlisted: false,
      error: `Role set to recruiter. Waitlist: ${wl.error}`,
    };
  }

  return { ok: true, waitlisted: true };
}
