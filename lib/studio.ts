/**
 * Studio draft shape + helpers (used with Supabase creator listings).
 */

import {
  computeQualityScore,
  normalizeExternalUrl,
} from "@/lib/portfolio";
import { minCategoryPrice, syncCategoryPrices } from "@/lib/pricing";
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
  /** @deprecated use category_prices — kept as min cache */
  starting_price: number;
  edit_starting_price: number;
  /** Category → package starting price (INR) */
  category_prices: Record<string, number>;
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
  const category_prices = syncCategoryPrices(categories, {}, "shoot");
  return {
    full_name: "",
    tagline: "",
    bio: "",
    avatar_url: "",
    cover_url: "",
    starting_price: minCategoryPrice(category_prices),
    edit_starting_price: 5000,
    category_prices,
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

export function draftToCreator(draft: StudioDraft): CreatorCardModel {
  const links: ExternalLinks = {
    portfolio_url: normalizeExternalUrl(draft.links.portfolio_url ?? "") || null,
    instagram_url: normalizeExternalUrl(draft.links.instagram_url ?? "") || null,
    showreel_url: normalizeExternalUrl(draft.links.showreel_url ?? "") || null,
  };

  const category_prices =
    Object.keys(draft.category_prices || {}).length > 0
      ? draft.category_prices
      : syncCategoryPrices(draft.categories, {}, "shoot");

  const fromPrice = minCategoryPrice(category_prices) || draft.starting_price;

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
    edit_starting_price: draft.edit_starting_price,
    edit_portfolio: draft.works
      .filter((w) => w.role === "edit" || w.role === "both")
      .map((w) => w.url),
    works: draft.works,
    links,
    listing_status: draft.listing_status,
    quality_score: 0,
    category_prices,
  };
  return { ...base, quality_score: computeQualityScore(base) };
}
