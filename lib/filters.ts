import { isProCreator } from "@/lib/format";
import type { CreatorCardModel, SearchFilters, ServiceMode } from "@/lib/types";

export const EMPTY_FILTERS: SearchFilters = {
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
    filters.locations.length > 0 ||
    filters.categories.length > 0 ||
    filters.proOnly ||
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
  const filtered = creators.filter((creator) => {
    // Directory only shows published listings (vetting gate)
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

    if (filters.locations.length > 0) {
      const hit = filters.locations.some((loc) =>
        creator.sub_regions.some(
          (r) => r.toLowerCase() === loc.toLowerCase()
        )
      );
      if (!hit) return false;
    }

    if (filters.categories.length > 0) {
      const pool =
        mode === "edit"
          ? [
              ...creator.categories,
              ...(creator.edit_specialties ?? []),
            ]
          : creator.categories;
      const hit = filters.categories.some((cat) => pool.includes(cat));
      if (!hit) return false;
    }

    if (filters.proOnly && !isProCreator(creator)) {
      return false;
    }

    const price =
      mode === "edit"
        ? (creator.edit_starting_price ?? creator.starting_price)
        : creator.starting_price;
    if (filters.under15k && price > 15000) {
      return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    const proA = isProCreator(a) ? 1 : 0;
    const proB = isProCreator(b) ? 1 : 0;
    if (proA !== proB) return proB - proA;
    return b.rating - a.rating;
  });
}

export function shootersOnly(creators: CreatorCardModel[]) {
  return creators.filter((c) => c.service_modes.includes("shoot"));
}

export function editorsOnly(creators: CreatorCardModel[]) {
  return creators.filter((c) => c.service_modes.includes("edit"));
}
