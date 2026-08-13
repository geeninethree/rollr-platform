import type {
  CreatorCardModel,
  ExternalLinks,
  PortfolioItem,
  PortfolioRole,
  QualityCheck,
  ServiceMode,
} from "@/lib/types";

export function worksForMode(
  works: PortfolioItem[],
  mode: ServiceMode
): PortfolioItem[] {
  return works
    .filter((w) => {
      if (mode === "shoot") return w.role === "shoot" || w.role === "both";
      return w.role === "edit" || w.role === "both";
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function featuredWorks(
  works: PortfolioItem[],
  mode: ServiceMode,
  limit = 3
): PortfolioItem[] {
  const pool = worksForMode(works, mode);
  const featured = pool.filter((w) => w.is_featured);
  const list = featured.length > 0 ? featured : pool;
  return list.slice(0, limit);
}

export function featuredUrls(
  creator: CreatorCardModel,
  mode: ServiceMode,
  limit = 3
): string[] {
  return featuredWorks(creator.works, mode, limit).map((w) => w.url);
}

export function coverForMode(
  creator: CreatorCardModel,
  mode: ServiceMode
): string {
  const featured = featuredWorks(creator.works, mode, 1)[0];
  if (featured) return featured.url;
  if (mode === "edit" && creator.edit_portfolio?.[0]) {
    return creator.edit_portfolio[0];
  }
  return creator.cover_url;
}

export function workCount(creator: CreatorCardModel, mode?: ServiceMode) {
  if (!mode) return creator.works.length;
  return worksForMode(creator.works, mode).length;
}

export function hasExternalLinks(links: ExternalLinks) {
  return Boolean(
    links.portfolio_url || links.instagram_url || links.showreel_url
  );
}

export function normalizeExternalUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function linkLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Live checklist for publish readiness (no Supabase). */
export function qualityChecks(
  creator: Pick<
    CreatorCardModel,
    | "full_name"
    | "bio"
    | "avatar_url"
    | "cover_url"
    | "works"
    | "links"
    | "service_modes"
    | "categories"
    | "sub_regions"
    | "tagline"
  >
): QualityCheck[] {
  const shootWorks = worksForMode(creator.works, "shoot");
  const editWorks = worksForMode(creator.works, "edit");
  const claimsShoot = creator.service_modes.includes("shoot");
  const claimsEdit = creator.service_modes.includes("edit");
  const featured = creator.works.filter((w) => w.is_featured);

  return [
    {
      id: "name",
      label: "Full name",
      ok: Boolean(creator.full_name?.trim()),
      required: true,
    },
    {
      id: "avatar",
      label: "Profile photo",
      ok: Boolean(creator.avatar_url),
      required: true,
    },
    {
      id: "cover",
      label: "Cover image",
      ok: Boolean(creator.cover_url),
      required: true,
    },
    {
      id: "bio",
      label: "Bio (40+ characters)",
      ok: (creator.bio?.trim().length ?? 0) >= 40,
      required: true,
    },
    {
      id: "areas",
      label: "At least one service area",
      ok: creator.sub_regions.length > 0,
      required: true,
    },
    {
      id: "categories",
      label: "At least one category",
      ok: creator.categories.length > 0,
      required: true,
    },
    {
      id: "works_min",
      label: "At least 3 portfolio pieces on ROLLR",
      ok: creator.works.length >= 3,
      required: true,
    },
    {
      id: "featured",
      label: "At least 3 featured pieces (for cards)",
      ok: featured.length >= 3,
      required: true,
    },
    {
      id: "shoot_samples",
      label: "Shoot samples if you offer coverage",
      ok: !claimsShoot || shootWorks.length >= 2,
      required: claimsShoot,
    },
    {
      id: "edit_samples",
      label: "Edit samples if you offer post",
      ok: !claimsEdit || editWorks.length >= 2,
      required: claimsEdit,
    },
    {
      id: "external",
      label: "Portfolio, Instagram, or showreel link",
      ok: hasExternalLinks(creator.links),
      required: false,
    },
  ];
}

export function computeQualityScore(
  creator: Parameters<typeof qualityChecks>[0]
): number {
  const checks = qualityChecks(creator);
  const required = checks.filter((c) => c.required);
  const optional = checks.filter((c) => !c.required);
  const reqScore =
    required.length === 0
      ? 70
      : (required.filter((c) => c.ok).length / required.length) * 80;
  const optScore =
    optional.length === 0
      ? 20
      : (optional.filter((c) => c.ok).length / optional.length) * 20;
  return Math.round(Math.min(100, reqScore + optScore));
}

export function meetsPublishRequirements(
  creator: Parameters<typeof qualityChecks>[0]
) {
  return qualityChecks(creator)
    .filter((c) => c.required)
    .every((c) => c.ok);
}

export function listingStatusLabel(status: CreatorCardModel["listing_status"]) {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending_review":
      return "Pending review";
    case "published":
      return "Published";
    case "rejected":
      return "Needs changes";
  }
}

/** Build portfolio items from image URLs (mock helpers). */
export function itemsFromUrls(
  urls: string[],
  role: PortfolioRole,
  opts?: { featuredCount?: number; category?: string; prefix?: string }
): PortfolioItem[] {
  const featuredCount = opts?.featuredCount ?? 3;
  return urls.map((url, i) => ({
    id: `${opts?.prefix ?? role}-${i}`,
    url,
    media_type: "image" as const,
    role,
    is_featured: i < featuredCount,
    sort_order: i,
    category: opts?.category,
    title: opts?.category ? `${opts.category} work` : undefined,
  }));
}

export function mergeWorks(...groups: PortfolioItem[][]): PortfolioItem[] {
  return groups.flat().map((w, i) => ({ ...w, sort_order: i }));
}
