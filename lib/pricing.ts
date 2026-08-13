/**
 * Creator pricing: named packages (primary) + optional category floors (legacy/derived).
 * Guides are soft hints for Mumbai event work — creators set their own numbers.
 */

export type CategoryPrices = Record<string, number>;

/** Shoot coverage vs edit/post vs both (for hybrid creators). */
export type PackageMode = "shoot" | "edit" | "both";

/** A sellable package on the listing (custom names allowed). */
export type PricingPackage = {
  id: string;
  /** e.g. "Wedding full day", "Corporate half day", "3 reels" */
  name: string;
  /** What's included */
  description?: string;
  /** INR package floor; 0 = on request */
  price: number;
  /** e.g. "Starting", "Full day", "Per reel" */
  unit?: string;
  /** Optional link to a directory category for filters */
  category?: string;
  /** Default shoot — use edit for post packages */
  mode?: PackageMode;
};

export type PriceGuide = {
  /** What the number means */
  unit: string;
  /** Soft market hint for Mumbai */
  hint: string;
  /** Prefill when creator first picks the category */
  suggested: number;
};

export function newPricingPackage(
  partial?: Partial<PricingPackage>
): PricingPackage {
  const mode: PackageMode =
    partial?.mode === "edit" || partial?.mode === "both"
      ? partial.mode
      : "shoot";
  return {
    id: partial?.id || `pkg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: partial?.name ?? "",
    description: partial?.description ?? "",
    price: Math.max(0, Math.round(Number(partial?.price) || 0)),
    unit: partial?.unit ?? "Starting package",
    category: partial?.category || undefined,
    mode,
  };
}

export function minPackagePrice(
  packages: PricingPackage[] | undefined | null,
  mode?: PackageMode | "any"
): number {
  if (!packages?.length) return 0;
  const list =
    !mode || mode === "any"
      ? packages
      : packages.filter((p) => packageMatchesMode(p, mode));
  const vals = list
    .map((p) => Number(p.price) || 0)
    .filter((n) => n > 0);
  return vals.length ? Math.min(...vals) : 0;
}

export function packageMatchesMode(
  pkg: PricingPackage,
  mode: PackageMode | "shoot" | "edit"
): boolean {
  const m = pkg.mode || "shoot";
  if (mode === "shoot") return m === "shoot" || m === "both";
  if (mode === "edit") return m === "edit" || m === "both";
  return true;
}

export function packagesForMode(
  packages: PricingPackage[] | undefined | null,
  mode: PackageMode | "shoot" | "edit"
): PricingPackage[] {
  return (packages || []).filter((p) => packageMatchesMode(p, mode));
}

/** Rate card / quote line shape from listing packages. */
export function packagesToRateCardPackages(
  packages: PricingPackage[]
): { name: string; description: string; price: number; unit?: string }[] {
  return packages
    .filter((p) => p.name.trim())
    .map((p) => ({
      name: p.name.trim().slice(0, 120),
      description: [
        p.description?.trim(),
        p.mode && p.mode !== "shoot" ? `(${p.mode === "both" ? "Shoot + edit" : "Edit / post"})` : "",
        p.category ? `Category: ${p.category}` : "",
      ]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 400),
      price: Math.max(0, Math.round(Number(p.price) || 0)),
      unit: (p.unit || "Starting package").slice(0, 60),
    }));
}

export function packagesToQuoteLineItems(
  packages: PricingPackage[]
): { description: string; quantity: number; unit_amount: number }[] {
  const lines = packages
    .filter((p) => p.name.trim() && (Number(p.price) || 0) > 0)
    .map((p) => ({
      description: [p.name.trim(), p.unit, p.category]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 300),
      quantity: 1,
      unit_amount: Math.max(0, Math.round(Number(p.price) || 0)),
    }));
  return lines.length
    ? lines
    : [{ description: "Creative services", quantity: 1, unit_amount: 0 }];
}

/** Derive category → min price map from packages (for filters / legacy UI). */
export function categoryPricesFromPackages(
  packages: PricingPackage[],
  categories: string[]
): CategoryPrices {
  const next: CategoryPrices = {};
  for (const cat of categories) {
    const matching = packages.filter(
      (p) => p.category === cat && (Number(p.price) || 0) > 0
    );
    if (matching.length) {
      next[cat] = Math.min(...matching.map((p) => Number(p.price) || 0));
    }
  }
  // If no category tags, fold lowest package into first category for directory floors
  if (Object.keys(next).length === 0 && categories[0]) {
    const floor = minPackagePrice(packages);
    if (floor > 0) next[categories[0]] = floor;
  }
  return next;
}

/** Migrate legacy category_prices → packages when packages empty. */
export function packagesFromCategoryPrices(
  categories: string[],
  prices: CategoryPrices,
  mode: "shoot" | "edit" = "shoot"
): PricingPackage[] {
  const cats = categories.length ? categories : Object.keys(prices);
  if (!cats.length) {
    return [
      newPricingPackage({
        name: "Starting package",
        price: 10000,
        unit: "Starting package",
      }),
    ];
  }
  return cats.map((cat) => {
    const guide = getPriceGuide(cat, mode);
    const price = prices[cat] > 0 ? prices[cat] : guide.suggested;
    return newPricingPackage({
      name: `${cat} package`,
      description: "",
      price,
      unit: guide.unit,
      category: cat,
      mode: mode === "edit" ? "edit" : "shoot",
    });
  });
}

export function normalizePackages(
  raw: unknown,
  opts?: { keepEmptyNames?: boolean }
): PricingPackage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const name = String(r.name || "").trim();
      if (!name && !opts?.keepEmptyNames) return null;
      const modeRaw = String(r.mode || "shoot");
      const mode: PackageMode =
        modeRaw === "edit" || modeRaw === "both" ? modeRaw : "shoot";
      return newPricingPackage({
        id: String(r.id || `pkg_${Math.random().toString(36).slice(2, 9)}`),
        name: name.slice(0, 120),
        description: String(r.description || "").slice(0, 400),
        price: Math.max(0, Math.round(Number(r.price) || 0)),
        unit: String(r.unit || "Starting package").slice(0, 60),
        category: r.category ? String(r.category).slice(0, 80) : undefined,
        mode,
      });
    })
    .filter(Boolean) as PricingPackage[];
}

/** Shoot / event coverage package guides */
export const SHOOT_PRICE_GUIDES: Record<string, PriceGuide> = {
  Wedding: {
    unit: "Starting package (event)",
    hint: "Mumbai ballpark often ₹15k–₹80k+ depending on hours & team",
    suggested: 25000,
  },
  Nightclub: {
    unit: "Starting package (gig / night)",
    hint: "Often ₹8k–₹25k for a few hours of coverage",
    suggested: 12000,
  },
  Corporate: {
    unit: "Starting package (day / event)",
    hint: "Often ₹15k–₹50k for conferences & brand days",
    suggested: 18000,
  },
  Fashion: {
    unit: "Starting package (lookbook / half day)",
    hint: "Often ₹12k–₹40k depending on deliverables",
    suggested: 15000,
  },
  "Real Estate": {
    unit: "Starting package (property set)",
    hint: "Often ₹5k–₹15k per listing shoot + reel",
    suggested: 8000,
  },
  Concert: {
    unit: "Starting package (show)",
    hint: "Often ₹10k–₹30k for stage + crowd coverage",
    suggested: 14000,
  },
  Product: {
    unit: "Starting package (product set)",
    hint: "Often ₹6k–₹20k for stills / short motion",
    suggested: 9000,
  },
  "Personal Events": {
    unit: "Starting package (event)",
    hint: "Birthdays, anniversaries, pujas, private parties — often ₹8k–₹35k",
    suggested: 12000,
  },
  Podcasts: {
    unit: "Starting package (episode / setup)",
    hint: "Multi-cam podcast or creator studio — often ₹5k–₹20k per session",
    suggested: 8000,
  },
  Custom: {
    unit: "Starting package (custom brief)",
    hint: "Set your floor for bespoke jobs; quote fully after the brief",
    suggested: 10000,
  },
};

/** Edit / post package guides */
export const EDIT_PRICE_GUIDES: Record<string, PriceGuide> = {
  "Wedding film": {
    unit: "Starting package (film / teaser)",
    hint: "Often ₹10k–₹40k depending on runtime",
    suggested: 15000,
  },
  "Reels / vertical": {
    unit: "Starting package (reel batch)",
    hint: "Often ₹3k–₹12k for a small set of reels",
    suggested: 5000,
  },
  "Colour grade": {
    unit: "Starting package (grade pass)",
    hint: "Often ₹5k–₹20k by length & complexity",
    suggested: 8000,
  },
  "Corporate highlight": {
    unit: "Starting package (highlight reel)",
    hint: "Often ₹12k–₹35k for event films",
    suggested: 15000,
  },
  "Same-day teaser": {
    unit: "Starting package (same-day cut)",
    hint: "Often ₹5k–₹15k rush fee included",
    suggested: 8000,
  },
  "Multi-cam edit": {
    unit: "Starting package (sync + edit)",
    hint: "Often ₹15k–₹50k for multi-cam shows",
    suggested: 20000,
  },
  "Product polish": {
    unit: "Starting package (product edit)",
    hint: "Often ₹4k–₹15k for a set of cuts",
    suggested: 6000,
  },
};

export function getPriceGuide(
  category: string,
  mode: "shoot" | "edit" = "shoot"
): PriceGuide {
  const map = mode === "edit" ? EDIT_PRICE_GUIDES : SHOOT_PRICE_GUIDES;
  return (
    map[category] ?? {
      unit: "Starting package",
      hint: "Set your package floor for this category (not hourly)",
      suggested: 10000,
    }
  );
}

export function minCategoryPrice(prices: CategoryPrices | undefined | null): number {
  if (!prices) return 0;
  const vals = Object.values(prices).filter((n) => typeof n === "number" && n > 0);
  return vals.length ? Math.min(...vals) : 0;
}

export function syncCategoryPrices(
  categories: string[],
  existing: CategoryPrices,
  mode: "shoot" | "edit" = "shoot"
): CategoryPrices {
  const next: CategoryPrices = {};
  for (const cat of categories) {
    if (existing[cat] != null && existing[cat] > 0) {
      next[cat] = existing[cat];
    } else {
      next[cat] = getPriceGuide(cat, mode).suggested;
    }
  }
  return next;
}

export function formatFromPrice(price: number): string {
  if (!price || price <= 0) return "Price on request";
  return `From ${new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price)}`;
}
