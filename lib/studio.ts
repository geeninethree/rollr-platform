/**
 * Studio draft shape + helpers (used with Supabase creator listings).
 */

import {
  computeQualityScore,
  normalizeExternalUrl,
} from "@/lib/portfolio";
import {
  categoryPricesFromPackages,
  minCategoryPrice,
  minPackagePrice,
  packagesFromCategoryPrices,
  syncCategoryPrices,
  type PricingPackage,
} from "@/lib/pricing";
import type {
  CreatorCardModel,
  ExternalLinks,
  ListingStatus,
  PortfolioItem,
  ServiceMode,
} from "@/lib/types";

export type StudioDraft = {
  full_name: string;
  tagline: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
  /** Min package floor — directory "From ₹…" */
  starting_price: number;
  edit_starting_price: number;
  /**
   * Derived from packages (and legacy). Prefer pricing_packages.
   * Kept for directory cards / filters.
   */
  category_prices: Record<string, number>;
  /** Named packages (primary pricing UX) */
  pricing_packages: PricingPackage[];
  /** Deposit, travel, what's included notes */
  pricing_notes: string;
  sub_regions: string[];
  categories: string[];
  service_modes: ServiceMode[];
  links: ExternalLinks;
  works: PortfolioItem[];
  listing_status: ListingStatus;
  updated_at: string;
};

/** Preview-only placeholders — not treated as real uploads in quality checks */
export const PREVIEW_AVATAR =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80";
export const PREVIEW_COVER =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80";

export function emptyStudioDraft(): StudioDraft {
  const categories = ["Wedding"];
  const pricing_packages = packagesFromCategoryPrices(categories, {}, "shoot");
  const category_prices = categoryPricesFromPackages(
    pricing_packages,
    categories
  );
  return {
    full_name: "",
    tagline: "",
    bio: "",
    avatar_url: "",
    cover_url: "",
    starting_price:
      minPackagePrice(pricing_packages) || minCategoryPrice(category_prices),
    edit_starting_price: 5000,
    category_prices,
    pricing_packages,
    pricing_notes: "",
    sub_regions: ["Bandra"],
    categories,
    service_modes: ["shoot"],
    links: {
      portfolio_url: "",
      instagram_url: "",
      showreel_url: "",
    },
    works: [],
    listing_status: "draft",
    updated_at: new Date().toISOString(),
  };
}

/**
 * Recompute directory floors from packages.
 * Important: empty array stays empty (do not re-seed) so “delete all” works.
 * Pass seedIfEmpty only when loading legacy listings.
 */
export function withSyncedPricing(
  draft: Pick<
    StudioDraft,
    "categories" | "pricing_packages" | "category_prices" | "starting_price"
  > &
    Partial<StudioDraft>,
  opts?: { seedIfEmpty?: boolean }
): Pick<
  StudioDraft,
  "pricing_packages" | "category_prices" | "starting_price" | "edit_starting_price"
> {
  let packages = Array.isArray(draft.pricing_packages)
    ? draft.pricing_packages
    : [];
  if (packages.length === 0 && opts?.seedIfEmpty) {
    packages = packagesFromCategoryPrices(
      draft.categories,
      draft.category_prices || {},
      "shoot"
    );
  }
  const category_prices = categoryPricesFromPackages(
    packages,
    draft.categories
  );
  const fromPrice =
    minPackagePrice(packages) ||
    minCategoryPrice(category_prices) ||
    draft.starting_price ||
    0;
  const editFloor =
    minPackagePrice(packages, "edit") ||
    Number(draft.edit_starting_price) ||
    0;
  return {
    pricing_packages: packages,
    category_prices:
      Object.keys(category_prices).length > 0
        ? category_prices
        : draft.categories.length
          ? syncCategoryPrices(
              draft.categories,
              draft.category_prices || {},
              "shoot"
            )
          : {},
    starting_price: fromPrice,
    edit_starting_price: editFloor,
  };
}

export function draftToCreator(draft: StudioDraft): CreatorCardModel {
  const links: ExternalLinks = {
    portfolio_url: normalizeExternalUrl(draft.links.portfolio_url ?? "") || null,
    instagram_url: normalizeExternalUrl(draft.links.instagram_url ?? "") || null,
    showreel_url: normalizeExternalUrl(draft.links.showreel_url ?? "") || null,
  };

  const synced = withSyncedPricing(draft);
  const fromPrice = synced.starting_price;

  const base: CreatorCardModel = {
    id: "studio-draft",
    profile_id: "studio-draft",
    full_name: draft.full_name || "Your name",
    email: "you@studio.local",
    // Keep empty when missing so quality checklist requires a real upload
    avatar_url: draft.avatar_url || "",
    bio: draft.bio || null,
    starting_price: fromPrice,
    cities: ["Mumbai"],
    sub_regions: draft.sub_regions,
    categories: draft.categories,
    is_featured: draft.listing_status === "published",
    sub_status:
      draft.listing_status === "published" ? "active" : "inactive",
    cover_url: draft.cover_url || "",
    portfolio: draft.works.filter((w) => w.role !== "edit").map((w) => w.url),
    tagline: draft.tagline || "Your tagline",
    rating: 0,
    review_count: 0,
    response_label: "Usually replies within a day",
    service_modes: draft.service_modes,
    edit_starting_price: synced.edit_starting_price || draft.edit_starting_price,
    edit_portfolio: draft.works
      .filter((w) => w.role === "edit" || w.role === "both")
      .map((w) => w.url),
    works: draft.works,
    links,
    listing_status: draft.listing_status,
    quality_score: 0,
    category_prices: synced.category_prices,
    pricing_packages: synced.pricing_packages,
    pricing_notes: draft.pricing_notes || "",
  };
  return { ...base, quality_score: computeQualityScore(base) };
}
