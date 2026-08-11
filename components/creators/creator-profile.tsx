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
import { ReviewsSection } from "@/components/creators/reviews-section";
import { ProfileShareCard } from "@/components/share/profile-share-card";
import {
  displayPriceForMode,
  formatPriceInr,
  hasService,
  isHybrid,
  priceLabelFrom,
} from "@/lib/format";
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

  return (
    <div className="bg-grid-fade">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
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

        {/* Cinematic hero — fixed height so cover never stretches the page */}
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/40">
          <div className="media-frame relative h-[220px] w-full max-h-[40vh] bg-secondary sm:h-[280px] sm:max-h-[42vh] lg:h-[320px] lg:max-h-none">
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
                  "linear-gradient(to top, hsl(0 0% 0%) 0%, hsl(0 0% 0% / 0.75) 28%, transparent 62%)",
                  "linear-gradient(to bottom, hsl(0 0% 0% / 0.45) 0%, transparent 35%)",
                  "linear-gradient(to right, hsl(0 0% 0% / 0.25) 0%, transparent 40%)",
                ].join(", "),
              }}
            />
            <div className="absolute right-4 top-4 z-[2] flex flex-col items-end gap-1.5">
              {hybrid && (
                <Badge className="border border-white/20 bg-black/50 text-white backdrop-blur-sm">
                  Shoots + edits
                </Badge>
              )}
              <ListingStatusBadge status={creator.listing_status} />
            </div>

            {/* Identity on cover (mock 26) — stays inside the frame */}
            <div className="absolute inset-x-0 bottom-0 z-[2] p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-end gap-3 sm:gap-4">
                  <div className="media-frame relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/20 shadow-lg sm:h-20 sm:w-20">
                    {creator.avatar_url ? (
                      <Image
                        src={creator.avatar_url}
                        alt={creator.full_name}
                        fill
                        sizes="80px"
                        className="object-cover"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-secondary text-lg font-semibold">
                        {creator.full_name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h1 className="truncate text-xl font-semibold tracking-tight text-white drop-shadow sm:text-2xl lg:text-3xl">
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
                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/70 sm:text-sm">
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

                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] text-white/50">Packages from</p>
                    <p className="text-xl font-semibold text-gold sm:text-2xl">
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

        {/* Body */}
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            {canShoot && canEdit && (
              <div className="inline-flex rounded-full border border-border bg-card p-1">
                <button
                  type="button"
                  onClick={() => setTab("shoot")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    tab === "shoot"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Video className="h-3.5 w-3.5" />
                  Coverage
                </button>
                <button
                  type="button"
                  onClick={() => setTab("edit")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    tab === "edit"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
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
              <h2 className="text-lg font-semibold tracking-tight">
                About
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                {bio}
              </p>
              <p className="text-xs text-muted-foreground">
                {workCount(creator)} works on ROLLR
                {creator.quality_score
                  ? ` · quality ${creator.quality_score}/100`
                  : ""}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight">
                Portfolio
              </h2>
              <PortfolioGallery
                works={creator.works}
                mode={tab}
                creatorName={creator.full_name}
              />
            </section>

            <ExternalLinksSection links={creator.links} />

            <ReviewsSection
              creatorId={creator.id}
              rating={creator.rating}
              reviewCount={creator.review_count}
            />
          </div>

          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-lg shadow-black/25">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Packages from
              </p>
              <p className="mt-1 text-2xl font-semibold text-gold">
                {priceLabelFrom(price)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Category floors — not hourly. Final quote after brief.
              </p>

              {Object.keys(creator.category_prices || {}).length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
                  {Object.entries(creator.category_prices)
                    .filter(([, p]) => p > 0)
                    .sort((a, b) => a[1] - b[1])
                    .map(([cat, p]) => (
                      <li
                        key={cat}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-muted-foreground">{cat}</span>
                        <span className="font-medium tabular-nums text-gold">
                          {formatPriceInr(p)}
                        </span>
                      </li>
                    ))}
                </ul>
              )}

              <SendBriefButton
                creator={creator}
                surface={tab}
                defaultBriefType={defaultBriefType}
                size="lg"
                className="mt-4 w-full"
                label="Send brief"
              />

              <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p>
                  Number stays private. They WhatsApp you only after accepting.
                </p>
              </div>
            </div>

            <ProfileShareCard
              listingId={creator.id}
              creatorName={creator.full_name}
              compact
            />

            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Services</p>
              <p className="mt-1">
                {creator.service_modes
                  .map((m) =>
                    m === "shoot" ? "Event coverage" : "Editing / post"
                  )
                  .join(" · ")}
              </p>
              <p className="mt-3 font-medium text-foreground">Areas</p>
              <p className="mt-1">{creator.sub_regions.join(", ")}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
