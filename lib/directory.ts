import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeQualityScore,
  itemsFromUrls,
  mergeWorks,
} from "@/lib/portfolio";
import { minCategoryPrice } from "@/lib/pricing";
import type {
  CreatorCardModel,
  ListingStatus,
  PortfolioItem,
  ServiceMode,
  SubscriptionStatus,
} from "@/lib/types";

type Row = {
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
  works: PortfolioItem[] | unknown;
  category_prices: Record<string, number> | null;
  rating_avg?: number | null;
  review_count?: number | null;
  profiles: {
    full_name: string;
    email?: string;
    avatar_url: string | null;
  } | null;
};

function parseWorks(raw: unknown): PortfolioItem[] {
  if (Array.isArray(raw)) return raw as PortfolioItem[];
  return [];
}

export function rowToCreatorCard(row: Row): CreatorCardModel {
  const profile = row.profiles;
  const works = parseWorks(row.works);
  const modes = (row.service_modes || ["shoot"]).filter(
    (m): m is ServiceMode => m === "shoot" || m === "edit"
  );
  const categories = row.categories?.length ? row.categories : [];
  const category_prices =
    row.category_prices && typeof row.category_prices === "object"
      ? (row.category_prices as Record<string, number>)
      : {};

  const fromPrice =
    minCategoryPrice(category_prices) || Number(row.starting_price ?? 0);

  // If works empty, synthesize from cover so cards don't look broken
  let finalWorks = works;
  if (finalWorks.length === 0 && row.cover_url) {
    finalWorks = itemsFromUrls([row.cover_url], "shoot", {
      prefix: row.id,
      category: categories[0],
    });
  }

  const shootUrls = finalWorks
    .filter((w) => w.role === "shoot" || w.role === "both")
    .map((w) => w.url);
  const editUrls = finalWorks
    .filter((w) => w.role === "edit" || w.role === "both")
    .map((w) => w.url);

  const base: CreatorCardModel = {
    id: row.id,
    profile_id: row.profile_id,
    full_name: profile?.full_name || "Creator",
    // Never pull profile emails into public directory payloads
    email: "",
    avatar_url: profile?.avatar_url || null,
    bio: row.bio,
    starting_price: fromPrice,
    cities: row.cities?.length ? row.cities : ["Mumbai"],
    sub_regions: row.sub_regions || [],
    categories,
    is_featured: Boolean(row.is_featured),
    sub_status: (row.sub_status as SubscriptionStatus) || "inactive",
    cover_url:
      row.cover_url ||
      finalWorks[0]?.url ||
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    portfolio: shootUrls.length ? shootUrls : finalWorks.map((w) => w.url),
    tagline: row.tagline || "Mumbai visual creator",
    rating: Number(row.rating_avg ?? 0) || 0,
    review_count: Number(row.review_count ?? 0) || 0,
    response_label: "Message after brief accept",
    service_modes: modes.length ? modes : ["shoot"],
    edit_starting_price: Number(row.edit_starting_price ?? 0),
    edit_portfolio: editUrls,
    works: finalWorks.length ? finalWorks : mergeWorks(),
    links: {
      portfolio_url: row.portfolio_url,
      instagram_url: row.instagram_url,
      showreel_url: row.showreel_url,
    },
    listing_status: (row.listing_status as ListingStatus) || "draft",
    quality_score: 0,
    category_prices,
  };

  return { ...base, quality_score: computeQualityScore(base) };
}

/** Published listings only — no mock data. */
export async function fetchPublishedCreators(
  supabase: SupabaseClient
): Promise<{ creators: CreatorCardModel[]; error?: string }> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .select(
      `
      id,
      profile_id,
      bio,
      starting_price,
      cities,
      sub_regions,
      categories,
      is_featured,
      sub_status,
      tagline,
      service_modes,
      edit_starting_price,
      portfolio_url,
      instagram_url,
      showreel_url,
      cover_url,
      listing_status,
      works,
      category_prices,
      rating_avg,
      review_count,
      profiles!inner (
        full_name,
        avatar_url
      )
    `
    )
    .eq("listing_status", "published")
    .order("review_count", { ascending: false });

  if (error) {
    // Fallback without category_prices if migration 00004 not applied
    if (
      error.message.includes("category_prices") ||
      error.message.includes("column")
    ) {
      const retry = await supabase
        .from("creator_profiles")
        .select(
          `
          id,
          profile_id,
          bio,
          starting_price,
          cities,
          sub_regions,
          categories,
          is_featured,
          sub_status,
          tagline,
          service_modes,
          edit_starting_price,
          portfolio_url,
          instagram_url,
          showreel_url,
          cover_url,
          listing_status,
          works,
          profiles!inner (
            full_name,
            avatar_url
          )
        `
        )
        .eq("listing_status", "published");

      if (retry.error) {
        return { creators: [], error: retry.error.message };
      }

      const creators = (retry.data || []).map((r) =>
        rowToCreatorCard({
          ...(r as unknown as Row),
          category_prices: null,
        })
      );
      return { creators };
    }

    return { creators: [], error: error.message };
  }

  const creators = (data || []).map((r) =>
    rowToCreatorCard(r as unknown as Row)
  );
  return { creators };
}

export async function fetchCreatorById(
  supabase: SupabaseClient,
  id: string
): Promise<{ creator: CreatorCardModel | null; error?: string }> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .select(
      `
      id,
      profile_id,
      bio,
      starting_price,
      cities,
      sub_regions,
      categories,
      is_featured,
      sub_status,
      tagline,
      service_modes,
      edit_starting_price,
      portfolio_url,
      instagram_url,
      showreel_url,
      cover_url,
      listing_status,
      works,
      category_prices,
      rating_avg,
      review_count,
      profiles!inner (
        full_name,
        avatar_url
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    // Retry without category_prices
    const retry = await supabase
      .from("creator_profiles")
      .select(
        `
        id,
        profile_id,
        bio,
        starting_price,
        cities,
        sub_regions,
        categories,
        is_featured,
        sub_status,
        tagline,
        service_modes,
        edit_starting_price,
        portfolio_url,
        instagram_url,
        showreel_url,
        cover_url,
        listing_status,
        works,
        profiles!inner (
          full_name,
          avatar_url
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (retry.error) return { creator: null, error: retry.error.message };
    if (!retry.data) return { creator: null };
    return {
      creator: rowToCreatorCard({
        ...(retry.data as unknown as Row),
        category_prices: null,
      }),
    };
  }

  if (!data) return { creator: null };
  // RLS only returns published (or owner/admin). Treat non-published as missing for public.
  const row = data as unknown as Row;
  if (row.listing_status && row.listing_status !== "published") {
    return { creator: null };
  }
  return { creator: rowToCreatorCard(row) };
}
