/**
 * Local creator studio draft (browser only — no Supabase).
 */

import {
  computeQualityScore,
  meetsPublishRequirements,
  normalizeExternalUrl,
} from "@/lib/portfolio";
import type {
  CreatorCardModel,
  ExternalLinks,
  ListingStatus,
  PortfolioItem,
  ServiceMode,
} from "@/lib/types";

const STORAGE_KEY = "rollr_studio_draft_v1";
export const STUDIO_CHANGED = "rollr:studio-changed";

export type StudioDraft = {
  full_name: string;
  tagline: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
  starting_price: number;
  edit_starting_price: number;
  sub_regions: string[];
  categories: string[];
  service_modes: ServiceMode[];
  links: ExternalLinks;
  works: PortfolioItem[];
  listing_status: ListingStatus;
  updated_at: string;
};

const defaultAvatar =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80";
const defaultCover =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80";

export function emptyStudioDraft(): StudioDraft {
  return {
    full_name: "",
    tagline: "",
    bio: "",
    avatar_url: defaultAvatar,
    cover_url: defaultCover,
    starting_price: 10000,
    edit_starting_price: 5000,
    sub_regions: ["Bandra"],
    categories: ["Wedding"],
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

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadStudioDraft(): StudioDraft {
  if (!canUseStorage()) return emptyStudioDraft();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStudioDraft();
    return { ...emptyStudioDraft(), ...JSON.parse(raw) };
  } catch {
    return emptyStudioDraft();
  }
}

export function saveStudioDraft(draft: StudioDraft) {
  const next = { ...draft, updated_at: new Date().toISOString() };
  if (canUseStorage()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(STUDIO_CHANGED));
  }
  return next;
}

export function clearStudioDraft() {
  if (!canUseStorage()) return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(STUDIO_CHANGED));
}

export function draftToCreator(draft: StudioDraft): CreatorCardModel {
  const links: ExternalLinks = {
    portfolio_url: normalizeExternalUrl(draft.links.portfolio_url ?? "") || null,
    instagram_url: normalizeExternalUrl(draft.links.instagram_url ?? "") || null,
    showreel_url: normalizeExternalUrl(draft.links.showreel_url ?? "") || null,
  };

  const base: CreatorCardModel = {
    id: "studio-draft",
    profile_id: "studio-draft",
    full_name: draft.full_name || "Your name",
    email: "you@studio.local",
    avatar_url: draft.avatar_url || defaultAvatar,
    bio: draft.bio || null,
    starting_price: draft.starting_price,
    cities: ["Mumbai"],
    sub_regions: draft.sub_regions,
    categories: draft.categories,
    is_featured: draft.listing_status === "published",
    sub_status:
      draft.listing_status === "published" ? "active" : "inactive",
    cover_url: draft.cover_url || defaultCover,
    portfolio: draft.works.filter((w) => w.role !== "edit").map((w) => w.url),
    tagline: draft.tagline || "Your tagline",
    rating: 0,
    review_count: 0,
    response_label: "New on ROLLR",
    service_modes: draft.service_modes,
    edit_starting_price: draft.edit_starting_price,
    edit_portfolio: draft.works
      .filter((w) => w.role === "edit" || w.role === "both")
      .map((w) => w.url),
    works: draft.works,
    links,
    listing_status: draft.listing_status,
    quality_score: 0,
  };
  return { ...base, quality_score: computeQualityScore(base) };
}

export function submitDraftForReview(draft: StudioDraft): StudioDraft {
  const creator = draftToCreator(draft);
  if (!meetsPublishRequirements(creator)) {
    return saveStudioDraft({ ...draft, listing_status: "draft" });
  }
  return saveStudioDraft({ ...draft, listing_status: "pending_review" });
}
