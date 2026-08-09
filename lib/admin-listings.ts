import type { SupabaseClient } from "@supabase/supabase-js";
import { markReferralEarnedOnPublish } from "@/lib/referrals";
import type { ListingStatus } from "@/lib/types";

export type AdminListingRow = {
  id: string;
  profile_id: string;
  tagline: string | null;
  listing_status: ListingStatus;
  sub_regions: string[] | null;
  categories: string[] | null;
  created_at?: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
};

export async function fetchListingsByStatus(
  supabase: SupabaseClient,
  status: ListingStatus | "all" = "pending_review"
): Promise<{ rows: AdminListingRow[]; error?: string }> {
  let q = supabase
    .from("creator_profiles")
    .select(
      `
      id,
      profile_id,
      tagline,
      listing_status,
      sub_regions,
      categories,
      created_at,
      profiles ( full_name, email )
    `
    )
    .order("created_at", { ascending: false });

  if (status !== "all") {
    q = q.eq("listing_status", status);
  }

  const { data, error } = await q;
  if (error) return { rows: [], error: error.message };
  return { rows: (data || []) as unknown as AdminListingRow[] };
}

export async function setListingStatus(
  supabase: SupabaseClient,
  listingId: string,
  status: ListingStatus
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .update({
      listing_status: status,
      sub_status: status === "published" ? "active" : "inactive",
    })
    .eq("id", listingId)
    .select("profile_id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (status === "published" && data?.profile_id) {
    await markReferralEarnedOnPublish(supabase, data.profile_id as string);
  }
  return { ok: true };
}
