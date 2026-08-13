"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { CoverImage } from "@/components/ui/media-frame";
import Link from "next/link";
import {
  ArrowLeft,
  Clapperboard,
  Clock3,
  Lock,
  MapPin,
  Star,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SendBriefButton } from "@/components/inquiry/send-brief-button";
import { ExternalLinksSection } from "@/components/portfolio/external-links";
import { ListingStatusBadge } from "@/components/portfolio/listing-status-badge";
import { PortfolioGallery } from "@/components/portfolio/portfolio-gallery";
import { ProfileRateCard } from "@/components/creators/profile-rate-card";
import { ReviewsSection } from "@/components/creators/reviews-section";
import { ProfileShareCard } from "@/components/share/profile-share-card";
import {
  displayPriceForMode,
  formatPriceInr,
  hasService,
  isHybrid,
  priceLabelFrom,
} from "@/lib/format";
import { packagesForMode } from "@/lib/pricing";
import { workCount } from "@/lib/portfolio";
import type { BriefType, CreatorCardModel, ServiceMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type CreatorProfileProps = {
  creator: CreatorCardModel;
  initialTab?: ServiceMode;
};

export function CreatorProfile({ creator, initialTab }: CreatorProfileProps) {
  const hybrid = isHybrid(creator);
  const canShoot = hasService(creator, "shoot");
  const canEdit = hasService(creator, "edit");

  const defaultTab: ServiceMode =
    initialTab && hasService(creator, initialTab)
      ? initialTab
      : canShoot
        ? "shoot"
        : "edit";

  const [tab, setTab] = useState<ServiceMode>(defaultTab);

  const price = displayPriceForMode(creator, tab);
  const tagline =
    tab === "edit"
      ? (creator.edit_tagline ?? creator.tagline)
      : creator.tagline;
  const bio =
    tab === "edit" ? (creator.edit_bio ?? creator.bio) : creator.bio;
  const tags =
    tab === "edit"
      ? (creator.edit_specialties ?? creator.categories)
      : creator.categories;

  const defaultBriefType: BriefType = useMemo(() => {
    if (tab === "edit" && canEdit) return "edit";
    if (tab === "shoot" && canShoot) return "shoot";
    if (hybrid) return "full_package";
    return canEdit ? "edit" : "shoot";
  }, [tab, canEdit, canShoot, hybrid]);

  const tabPackages = useMemo(() => {
    const all = creator.pricing_packages || [];
    if (all.length === 0) return [];
    const filtered = packagesForMode(all, tab);
    // If tab filter empty (e.g. only shoot packages on edit tab), show all
    return filtered.length > 0 ? filtered : all;
  }, [creator.pricing_packages, tab]);

  return (
    <div className="bg-grid-fade">
      <div className="page-shell py-6 sm:py-8">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4 text-muted-foreground"
        >
          <Link href={tab === "edit" ? "/editors" : "/"}>
            <ArrowLeft className="h-4 w-4" />
            Back to {tab === "edit" ? "Editors" : "Photographers"}
          </Link>
        </Button>

        {/* Cover — image only on mobile so nothing clips; identity sits below */}
        <div className="relative mb-4 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/40 sm:mb-6">
          <div className="media-frame relative h-[180px] w-full bg-secondary sm:h-[260px] lg:h-[300px]">
            <CoverImage
              src={creator.cover_url}
              alt=""
              priority
              sizes="(max-width: 1280px) 100vw, 1152px"
            />
            <div
              className="pointer-events-none absolute inset-0 z-[1]"
              style={{
                background: [
                  "linear-gradient(to top, hsl(0 0% 0% / 0.55) 0%, transparent 55%)",
                  "linear-gradient(to bottom, hsl(0 0% 0% / 0.35) 0%, transparent 40%)",
                ].join(", "),
              }}
            />
            <div className="absolute right-3 top-3 z-[2] flex flex-col items-end gap-1.5 sm:right-4 sm:top-4">
              {hybrid && (
                <Badge className="border border-white/20 bg-black/50 text-white backdrop-blur-sm">
                  Shoots + edits
                </Badge>
              )}
              <ListingStatusBadge status={creator.listing_status} />
            </div>

            {/* Desktop overlay identity only — avoids mobile overflow */}
            <div className="absolute inset-x-0 bottom-0 z-[2] hidden p-6 sm:block">
              <div className="flex items-end justify-between gap-4">
                <div className="flex min-w-0 items-end gap-4">
                  <div className="media-frame relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white/20 shadow-lg">
                    {creator.avatar_url ? (
                      <Image
                        src={creator.avatar_url}
                        alt={creator.full_name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-secondary text-lg font-semibold">
                        {creator.full_name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h1 className="truncate text-2xl font-semibold tracking-tight text-white drop-shadow lg:text-3xl">
                      {creator.full_name}
                    </h1>
                    <p className="line-clamp-1 text-sm text-white/80">
                      {tagline}
                      {creator.sub_regions.length > 0 && (
                        <span className="text-white/55">
                          {" · "}
                          {creator.sub_regions.slice(0, 3).join(" · ")}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        {creator.review_count > 0 ? (
                          <>
                            <span className="font-medium text-white">
                              {creator.rating.toFixed(1)}
                            </span>
                            <span className="text-white/50">
                              ({creator.review_count})
                            </span>
                          </>
                        ) : (
                          <span>New on ROLLR</span>
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary/90" />
                        {creator.sub_regions[0] || "Mumbai"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5 text-primary/90" />
                        {tab === "edit" && creator.turnaround_label
                          ? creator.turnaround_label
                          : creator.response_label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-[11px] text-white/50">Packages from</p>
                    <p className="text-2xl font-semibold text-gold">
                      {priceLabelFrom(price)}
                    </p>
                  </div>
                  <SendBriefButton
                    creator={creator}
                    surface={tab}
                    defaultBriefType={defaultBriefType}
                    size="lg"
                    label="Send brief"
                    className="min-w-[9rem]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile identity card — always fully visible, no clipping */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 sm:hidden">
          <div className="flex gap-3">
            <div className="media-frame relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-secondary">
              {creator.avatar_url ? (
                <Image
                  src={creator.avatar_url}
                  alt={creator.full_name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-lg font-semibold">
                  {creator.full_name.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-xl font-semibold tracking-tight leading-tight break-words">
                {creator.full_name}
              </h1>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {tagline}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  {creator.review_count > 0
                    ? `${creator.rating.toFixed(1)} (${creator.review_count})`
                    : "New on ROLLR"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary/90" />
                  {creator.sub_regions[0] || "Mumbai"}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Packages from</p>
              <p className="text-xl font-semibold text-gold">
                {priceLabelFrom(price)}
              </p>
            </div>
            <p className="max-w-[9rem] text-right text-[11px] leading-snug text-muted-foreground">
              {tab === "edit" && creator.turnaround_label
                ? creator.turnaround_label
                : creator.response_label}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="grid min-w-0 gap-10 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-8">
            {canShoot && canEdit && (
              <div className="inline-flex max-w-full rounded-full border border-primary/20 bg-primary/[0.06] p-0.5">
                <button
                  type="button"
                  onClick={() => setTab("shoot")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-product sm:px-4",
                    tab === "shoot"
                      ? "bg-primary text-primary-foreground"
                      : "text-white/50 hover:text-white"
                  )}
                >
                  <Video className="h-3.5 w-3.5" />
                  Coverage
                </button>
                <button
                  type="button"
                  onClick={() => setTab("edit")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-product sm:px-4",
                    tab === "edit"
                      ? "bg-primary text-primary-foreground"
                      : "text-white/50 hover:text-white"
                  )}
                >
                  <Clapperboard className="h-3.5 w-3.5" />
                  Editing
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {tags.map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="rounded-full px-3"
                >
                  {cat}
                </Badge>
              ))}
              {tab === "edit" &&
                creator.edit_softwares?.map((s) => (
                  <Badge key={s} variant="outline" className="rounded-full">
                    {s}
                  </Badge>
                ))}
            </div>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight">About</h2>
              <p className="max-w-2xl break-words text-base leading-relaxed text-muted-foreground">
                {bio}
              </p>
              <p className="text-xs text-muted-foreground">
                {workCount(creator)} works on ROLLR
              </p>
            </section>

            <PortfolioGallery
              works={creator.works}
              mode={tab}
              creatorName={creator.full_name}
            />

            {creator.profile_id && (
              <ProfileRateCard
                creatorUserId={creator.profile_id}
                creatorName={creator.full_name}
              />
            )}

            <ExternalLinksSection links={creator.links} />

            <ReviewsSection
              creatorId={creator.id}
              rating={creator.rating}
              reviewCount={creator.review_count}
            />
          </div>

          <aside className="h-fit min-w-0 space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-lg shadow-black/25">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Packages from
              </p>
              <p className="mt-1 text-2xl font-semibold text-gold">
                {priceLabelFrom(price)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Package floors — not hourly. Final quote after brief.
              </p>

              {tabPackages.filter((p) => p.name.trim()).length > 0 ? (
                <ul className="mt-4 space-y-3 border-t border-border pt-3">
                  {tabPackages
                    .filter((p) => p.name.trim())
                    .slice(0, 8)
                    .map((pkg) => (
                      <li key={pkg.id} className="space-y-0.5">
                        <div className="flex items-start justify-between gap-2 text-xs">
                          <span className="min-w-0 font-medium text-foreground">
                            {pkg.name}
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums text-gold">
                            {pkg.price > 0
                              ? `From ${formatPriceInr(pkg.price)}`
                              : "On request"}
                          </span>
                        </div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {[
                            pkg.unit,
                            pkg.mode === "edit"
                              ? "Edit"
                              : pkg.mode === "both"
                                ? "Shoot + edit"
                                : null,
                            pkg.category,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {pkg.description && (
                          <p className="text-[11px] leading-relaxed text-muted-foreground">
                            {pkg.description}
                          </p>
                        )}
                      </li>
                    ))}
                </ul>
              ) : (
                Object.keys(creator.category_prices || {}).length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
                    {Object.entries(creator.category_prices)
                      .filter(([, p]) => p > 0)
                      .sort((a, b) => a[1] - b[1])
                      .map(([cat, p]) => (
                        <li
                          key={cat}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="min-w-0 truncate text-muted-foreground">
                            {cat}
                          </span>
                          <span className="shrink-0 font-medium tabular-nums text-gold">
                            {formatPriceInr(p)}
                          </span>
                        </li>
                      ))}
                  </ul>
                )
              )}

              {creator.pricing_notes && (
                <p className="mt-3 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
                  {creator.pricing_notes}
                </p>
              )}

              <div className="mt-4 hidden lg:block">
                <SendBriefButton
                  creator={creator}
                  surface={tab}
                  defaultBriefType={defaultBriefType}
                  size="lg"
                  className="w-full"
                  label="Send brief"
                />
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p>
                    Send a brief with your WhatsApp. If they&apos;re free,{" "}
                    <strong className="text-foreground">they message you</strong>{" "}
                    — no public phone hunt.
                  </p>
                </div>
              </div>
            </div>

            <ProfileShareCard
              listingId={creator.id}
              creatorName={creator.full_name}
              compact
            />

            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Services</p>
              <p className="mt-1 break-words">
                {creator.service_modes
                  .map((m) =>
                    m === "shoot" ? "Event coverage" : "Editing / post"
                  )
                  .join(" · ")}
              </p>
              <p className="mt-3 font-medium text-foreground">Areas</p>
              <p className="mt-1 break-words">
                {creator.sub_regions.join(", ")}
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky hire — floating capsule matching nav chrome */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
        <div className="page-shell !px-0">
          <div className="chrome-float mx-auto flex max-w-lg items-center gap-3 rounded-2xl p-2 pl-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-white/40">From</p>
              <p className="truncate text-sm font-semibold text-gold">
                {priceLabelFrom(price)}
              </p>
            </div>
            <SendBriefButton
              creator={creator}
              surface={tab}
              defaultBriefType={defaultBriefType}
              size="default"
              className="h-11 shrink-0 px-6 font-semibold"
              label="Send brief"
            />
          </div>
        </div>
      </div>
      <div className="h-24 lg:hidden" aria-hidden />
    </div>
  );
}
