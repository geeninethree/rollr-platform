/**
 * Category-based package pricing (not hourly).
 * Guides are soft hints for Mumbai event work — creators set their own numbers.
 */

export type CategoryPrices = Record<string, number>;

export type PriceGuide = {
  /** What the number means */
  unit: string;
  /** Soft market hint for Mumbai */
  hint: string;
  /** Prefill when creator first picks the category */
  suggested: number;
};

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
