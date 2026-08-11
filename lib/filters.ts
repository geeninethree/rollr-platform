import { displayPriceForMode } from "@/lib/format";
import type { CreatorCardModel, SearchFilters, ServiceMode } from "@/lib/types";

export const EMPTY_FILTERS: SearchFilters = {
  query: "",
  locations: [],
  eventDate: "",
  categories: [],
  proOnly: false,
  under15k: false,
  alsoEdits: false,
  alsoShoots: false,
};

export function hasActiveFilters(filters: SearchFilters, mode: ServiceMode) {
  return (
    Boolean(filters.query.trim()) ||
    filters.locations.length > 0 ||
    filters.categories.length > 0 ||
    filters.under15k ||
    Boolean(filters.eventDate) ||
    (mode === "shoot" && filters.alsoEdits) ||
    (mode === "edit" && filters.alsoShoots)
  );
}

export function filterCreators(
  creators: CreatorCardModel[],
  filters: SearchFilters,
  mode: ServiceMode
) {
  const q = filters.query.trim().toLowerCase();

  const filtered = creators.filter((creator) => {
    if (creator.listing_status && creator.listing_status !== "published") {
      return false;
    }
    if (!creator.service_modes.includes(mode)) return false;

    if (mode === "shoot" && filters.alsoEdits) {
      if (!creator.service_modes.includes("edit")) return false;
    }
    if (mode === "edit" && filters.alsoShoots) {
      if (!creator.service_modes.includes("shoot")) return false;
    }

    if (q) {
      const hay = [
        creator.full_name,
        creator.tagline,
        creator.bio,
        creator.edit_tagline,
        creator.edit_bio,
        ...creator.sub_regions,
        ...creator.categories,
        ...(creator.edit_specialties ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (filters.locations.length > 0) {
      const hit = filters.locations.some((loc) =>
        creator.sub_regions.some(
          (r) =>
            r.toLowerCase() === loc.toLowerCase() ||
            r.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase().includes(r.toLowerCase())
        )
      );
      if (!hit) return false;
    }

    if (filters.categories.length > 0) {
      const pool =
        mode === "edit"
          ? [...creator.categories, ...(creator.edit_specialties ?? [])]
          : creator.categories;
      const hit = filters.categories.some((cat) => pool.includes(cat));
      if (!hit) return false;
    }

    const price = displayPriceForMode(creator, mode);
    if (filters.under15k && price > 15000) {
      return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (b.review_count !== a.review_count) return b.review_count - a.review_count;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.full_name.localeCompare(b.full_name);
  });
}

export function shootersOnly(creators: CreatorCardModel[]) {
  return creators.filter((c) => c.service_modes.includes("shoot"));
}

export function editorsOnly(creators: CreatorCardModel[]) {
  return creators.filter((c) => c.service_modes.includes("edit"));
}
