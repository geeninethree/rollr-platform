import type { SupabaseClient } from "@supabase/supabase-js";

export const REFERRAL_CASHBACK_INR = 50;
export const REF_STORAGE_KEY = "rollr_referral_code";

export type ReferralReward = {
  id: string;
  referrer_id: string;
  referred_id: string;
  amount_inr: number;
  status: "pending" | "earned" | "paid";
  created_at: string;
  earned_at: string | null;
  referred_name?: string;
};

export function saveReferralCodeLocal(code: string) {
  if (typeof window === "undefined") return;
  const c = code.trim().toLowerCase();
  if (!c) return;
  try {
    localStorage.setItem(REF_STORAGE_KEY, c);
  } catch {
    /* ignore */
  }
}

export function getReferralCodeLocal(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REF_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearReferralCodeLocal() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(REF_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Ensure current user has a referral code; returns it. */
export async function ensureMyReferralCode(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (existing?.referral_code) return existing.referral_code as string;

  // Prefer RPC if available
  const { data: rpcCode, error: rpcError } = await supabase.rpc(
    "ensure_referral_code",
    { uid: userId }
  );
  if (!rpcError && rpcCode) return rpcCode as string;

  // Fallback client-side generate
  const code = userId.replace(/-/g, "").slice(0, 8).toLowerCase();
  const { error } = await supabase
    .from("profiles")
    .update({ referral_code: code })
    .eq("id", userId);
  if (error) return null;
  return code;
}

export function referralSignupUrl(origin: string, code: string) {
  return `${origin}/signup?ref=${encodeURIComponent(code)}`;
}

export function profileShareUrl(origin: string, listingId: string) {
  return `${origin}/creators/${listingId}`;
}

/** When a new user signs up with a ref code, attach referrer + pending reward. */
export async function attachReferralOnSignup(
  supabase: SupabaseClient,
  newUserId: string,
  refCode: string
): Promise<{ ok: boolean; error?: string }> {
  const code = refCode.trim().toLowerCase();
  if (!code) return { ok: false, error: "Empty code" };

  const { data: referrerId, error: lookupError } = await supabase.rpc(
    "lookup_referrer_by_code",
    { code }
  );

  if (lookupError) {
    // Fallback: direct query (may fail RLS for non-self)
    const { data: row } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!row?.id) return { ok: false, error: "Invalid referral code" };
    return attachReferralIds(supabase, newUserId, row.id as string);
  }

  if (!referrerId || referrerId === newUserId) {
    return { ok: false, error: "Invalid referral code" };
  }

  return attachReferralIds(supabase, newUserId, referrerId as string);
}

async function attachReferralIds(
  supabase: SupabaseClient,
  newUserId: string,
  referrerId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ referred_by: referrerId })
    .eq("id", newUserId)
    .is("referred_by", null);

  if (updErr) return { ok: false, error: updErr.message };

  const { error: insErr } = await supabase.from("referral_rewards").insert({
    referrer_id: referrerId,
    referred_id: newUserId,
    amount_inr: REFERRAL_CASHBACK_INR,
    status: "pending",
  });

  // Unique violation = already attached
  if (insErr && !insErr.message.toLowerCase().includes("duplicate")) {
    return { ok: false, error: insErr.message };
  }

  return { ok: true };
}

/** Call when referred creator publishes — mark reward earned. */
export async function markReferralEarnedOnPublish(
  supabase: SupabaseClient,
  publishedUserId: string
): Promise<void> {
  await supabase
    .from("referral_rewards")
    .update({
      status: "earned",
      earned_at: new Date().toISOString(),
    })
    .eq("referred_id", publishedUserId)
    .eq("status", "pending");
}

export async function fetchMyReferralStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  code: string | null;
  pendingCount: number;
  earnedCount: number;
  earnedTotalInr: number;
  rewards: ReferralReward[];
  error?: string;
}> {
  const code = await ensureMyReferralCode(supabase, userId);

  const { data, error } = await supabase
    .from("referral_rewards")
    .select("id, referrer_id, referred_id, amount_inr, status, created_at, earned_at")
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      code,
      pendingCount: 0,
      earnedCount: 0,
      earnedTotalInr: 0,
      rewards: [],
      error: error.message,
    };
  }

  const rewards = (data || []) as ReferralReward[];
  const pendingCount = rewards.filter((r) => r.status === "pending").length;
  const earned = rewards.filter(
    (r) => r.status === "earned" || r.status === "paid"
  );
  const earnedTotalInr = earned.reduce(
    (sum, r) => sum + Number(r.amount_inr || 0),
    0
  );

  return {
    code,
    pendingCount,
    earnedCount: earned.length,
    earnedTotalInr,
    rewards,
    error: undefined,
  };
}
