import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeQualityScore,
  meetsPublishRequirements,
  normalizeExternalUrl,
} from "@/lib/portfolio";
import {
  minCategoryPrice,
  minPackagePrice,
  normalizePackages,
  packagesFromCategoryPrices,
  syncCategoryPrices,
} from "@/lib/pricing";
import { markReferralEarnedOnPublish } from "@/lib/referrals";
import type { PortfolioItem, ServiceMode, ListingStatus } from "@/lib/types";
import {
  draftToCreator,
  emptyStudioDraft,
  withSyncedPricing,
  type StudioDraft,
} from "@/lib/studio";

export type CreatorListingRow = {
  id: string;
  profile_id: string;
  bio: string | null;
  starting_price: number | null;
  cities: string[] | null;
  sub_regions: string[] | null;
  categories: string[] | null;
  is_featured: boolean | null;
  sub_status: string | null;
  tagline: string | null;
  service_modes: string[] | null;
  edit_starting_price: number | null;
  portfolio_url: string | null;
  instagram_url: string | null;
  showreel_url: string | null;
  cover_url: string | null;
  listing_status: string | null;
  works: PortfolioItem[] | null;
  category_prices: Record<string, number> | null;
  pricing_packages?: unknown;
  pricing_notes?: string | null;
};

export async function ensureCreatorRole(
  supabase: SupabaseClient,
  userId: string,
  fullName?: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName || user?.email?.split("@")[0] || "Creator",
      email: user?.email || `${userId}@unknown.local`,
      role: "creator",
    });
    return;
  }

  if (profile.role !== "creator") {
    await supabase
      .from("profiles")
      .update({
        role: "creator",
        ...(fullName ? { full_name: fullName } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  } else if (fullName && fullName !== profile.full_name) {
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }
}

export async function loadCreatorListing(
  supabase: SupabaseClient,
  userId: string
): Promise<{ draft: StudioDraft; listingId: string | null; error?: string }> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return {
      draft: emptyStudioDraft(),
      listingId: null,
      error: profileError.message,
    };
  }

  const { data: listing, error: listingError } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle();

  if (listingError) {
    return {
      draft: {
        ...emptyStudioDraft(),
        full_name: profile?.full_name || "",
        avatar_url: profile?.avatar_url || emptyStudioDraft().avatar_url,
      },
      listingId: null,
      error: listingError.message,
    };
  }

  if (!listing) {
    return {
      draft: {
        ...emptyStudioDraft(),
        full_name: profile?.full_name || "",
        avatar_url: profile?.avatar_url || emptyStudioDraft().avatar_url,
      },
      listingId: null,
    };
  }

  const row = listing as CreatorListingRow;
  const works = Array.isArray(row.works) ? (row.works as PortfolioItem[]) : [];
  const modes = (row.service_modes || ["shoot"]).filter(
    (m): m is ServiceMode => m === "shoot" || m === "edit"
  );
  const categories = row.categories?.length ? row.categories : ["Wedding"];
  const existingPrices =
    row.category_prices && typeof row.category_prices === "object"
      ? row.category_prices
      : {};
  // Seed from starting_price if no map yet
  const seeded =
    Object.keys(existingPrices).length > 0
      ? existingPrices
      : Object.fromEntries(
          categories.map((c) => [c, Number(row.starting_price ?? 10000)])
        );
  const legacyPrices = syncCategoryPrices(categories, seeded, "shoot");
  let pricing_packages = normalizePackages(row.pricing_packages);
  if (pricing_packages.length === 0) {
    pricing_packages = packagesFromCategoryPrices(
      categories,
      legacyPrices,
      "shoot"
    );
  }
  const synced = withSyncedPricing(
    {
      categories,
      pricing_packages,
      category_prices: legacyPrices,
      starting_price: Number(row.starting_price ?? 0),
      edit_starting_price: Number(row.edit_starting_price ?? 0),
    },
    { seedIfEmpty: pricing_packages.length === 0 }
  );

  const draft: StudioDraft = {
    full_name: profile?.full_name || "",
    tagline: row.tagline || "",
    bio: row.bio || "",
    avatar_url: profile?.avatar_url || emptyStudioDraft().avatar_url,
    cover_url: row.cover_url || emptyStudioDraft().cover_url,
    starting_price: synced.starting_price,
    edit_starting_price: Number(row.edit_starting_price ?? 0),
    category_prices: synced.category_prices,
    pricing_packages: synced.pricing_packages,
    pricing_notes: row.pricing_notes || "",
    sub_regions: row.sub_regions?.length ? row.sub_regions : ["Bandra"],
    categories,
    service_modes: modes.length ? modes : ["shoot"],
    links: {
      portfolio_url: row.portfolio_url || "",
      instagram_url: row.instagram_url || "",
      showreel_url: row.showreel_url || "",
    },
    works,
    listing_status: (row.listing_status as ListingStatus) || "draft",
    updated_at: new Date().toISOString(),
  };

  return { draft, listingId: row.id };
}

export type SaveListingResult = {
  ok: boolean;
  listingId?: string;
  error?: string;
  draft?: StudioDraft;
};

export async function saveCreatorListing(
  supabase: SupabaseClient,
  userId: string,
  draft: StudioDraft,
  opts?: { submitForReview?: boolean }
): Promise<SaveListingResult> {
  await ensureCreatorRole(supabase, userId, draft.full_name.trim() || undefined);

  let listingStatus = draft.listing_status;
  if (opts?.submitForReview) {
    const creator = draftToCreator(draft);
    // Manual vetting: never auto-publish. Admin approves from /admin.
    listingStatus = meetsPublishRequirements(creator)
      ? "pending_review"
      : "draft";
  }

  // Already published creators can re-save without unpublishing unless they
  // only hit "save draft" without submit. If they submit again while published, keep published.
  if (
    opts?.submitForReview &&
    draft.listing_status === "published" &&
    meetsPublishRequirements(draftToCreator(draft))
  ) {
    listingStatus = "published";
  }

  const synced = withSyncedPricing(draft);
  const fromPrice =
    minPackagePrice(synced.pricing_packages) ||
    minCategoryPrice(synced.category_prices) ||
    0;

  const payload: Record<string, unknown> = {
    profile_id: userId,
    bio: draft.bio.trim() || null,
    starting_price: fromPrice || 0,
    cities: ["Mumbai"],
    sub_regions: draft.sub_regions,
    categories: draft.categories,
    tagline: draft.tagline.trim() || null,
    service_modes: draft.service_modes,
    edit_starting_price:
      synced.edit_starting_price || draft.edit_starting_price || 0,
    portfolio_url: normalizeExternalUrl(draft.links.portfolio_url ?? "") || null,
    instagram_url: normalizeExternalUrl(draft.links.instagram_url ?? "") || null,
    showreel_url: normalizeExternalUrl(draft.links.showreel_url ?? "") || null,
    cover_url: draft.cover_url || null,
    listing_status: listingStatus,
    works: draft.works,
    category_prices: synced.category_prices,
    pricing_packages: synced.pricing_packages,
    pricing_notes: draft.pricing_notes?.trim().slice(0, 1000) || null,
    // Featured flag reserved for later tiers — not auto on publish
    is_featured: false,
    sub_status: listingStatus === "published" ? "active" : "inactive",
  };

  const { data: existing } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  let listingId: string | undefined;
  let errorMsg: string | undefined;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("creator_profiles")
      .update(payload)
      .eq("profile_id", userId)
      .select("id")
      .single();
    if (error) errorMsg = error.message;
    else listingId = data.id;
  } else {
    const { data, error } = await supabase
      .from("creator_profiles")
      .insert(payload)
      .select("id")
      .single();
    if (error) errorMsg = error.message;
    else listingId = data.id;
  }

  // Retry stripping optional columns if migration not applied yet
  if (
    errorMsg &&
    (errorMsg.includes("category_prices") ||
      errorMsg.includes("pricing_packages") ||
      errorMsg.includes("pricing_notes"))
  ) {
    const rest = { ...payload };
    if (errorMsg.includes("pricing_packages") || errorMsg.includes("pricing_notes")) {
      delete rest.pricing_packages;
      delete rest.pricing_notes;
    }
    if (errorMsg.includes("category_prices")) {
      delete rest.category_prices;
    }
    if (existing?.id) {
      const { data, error } = await supabase
        .from("creator_profiles")
        .update(rest)
        .eq("profile_id", userId)
        .select("id")
        .single();
      if (error) errorMsg = error.message;
      else {
        errorMsg = undefined;
        listingId = data.id;
      }
    } else {
      const { data, error } = await supabase
        .from("creator_profiles")
        .insert(rest)
        .select("id")
        .single();
      if (error) errorMsg = error.message;
      else {
        errorMsg = undefined;
        listingId = data.id;
      }
    }
  }

  if (draft.avatar_url || draft.full_name) {
    await supabase
      .from("profiles")
      .update({
        avatar_url: draft.avatar_url || null,
        full_name: draft.full_name.trim() || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  if (errorMsg) {
    return { ok: false, error: errorMsg };
  }

  // Successful onboard: referred creator published → referrer earns ₹50
  if (listingStatus === "published") {
    await markReferralEarnedOnPublish(supabase, userId);
  }

  const nextDraft: StudioDraft = {
    ...draft,
    ...synced,
    starting_price: fromPrice,
    listing_status: listingStatus,
    updated_at: new Date().toISOString(),
  };

  return { ok: true, listingId, draft: nextDraft };
}

export function qualityFromDraft(draft: StudioDraft) {
  const creator = draftToCreator(draft);
  return {
    score: computeQualityScore(creator),
    ready: meetsPublishRequirements(creator),
    creator,
  };
}
