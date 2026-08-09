"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 mb-6 text-muted-foreground"
      >
        <Link href={tab === "edit" ? "/editors" : "/"}>
          <ArrowLeft className="h-4 w-4" />
          Back to {tab === "edit" ? "Editors" : "Photographers"}
        </Link>
      </Button>

      <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-xl border border-border bg-secondary sm:aspect-[2.6/1]">
        <Image
          src={creator.cover_url}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute right-4 top-4 flex flex-col items-end gap-1.5">
          {hybrid && (
            <Badge className="border border-border bg-background/85 text-foreground backdrop-blur-sm hover:bg-background/85">
              Shoots + edits
            </Badge>
          )}
          <ListingStatusBadge status={creator.listing_status} />
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <div className="flex flex-wrap items-end gap-4">
            <div className="relative -mt-20 h-24 w-24 overflow-hidden rounded-full border-4 border-background shadow-lg ring-1 ring-border">
              {creator.avatar_url && (
                <Image
                  src={creator.avatar_url}
                  alt={creator.full_name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {creator.full_name}
              </h1>
              <p className="text-muted-foreground">{tagline}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {workCount(creator)} works on ROLLR · quality{" "}
                {creator.quality_score}/100
              </p>
            </div>
          </div>

          {canShoot && canEdit && (
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => setTab("shoot")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === "shoot"
                    ? "bg-secondary text-foreground"
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
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === "edit"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Clapperboard className="h-3.5 w-3.5" />
                Editing
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-primary text-primary" />
              {creator.review_count > 0 ? (
                <>
                  <span className="font-medium text-foreground">
                    {creator.rating.toFixed(1)}
                  </span>
                  ({creator.review_count} review
                  {creator.review_count === 1 ? "" : "s"})
                </>
              ) : (
                <span className="font-medium text-foreground">New on ROLLR</span>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary/80" />
              {creator.sub_regions.join(" · ")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4 text-primary/80" />
              {tab === "edit" && creator.turnaround_label
                ? creator.turnaround_label
                : creator.response_label}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tags.map((cat) => (
              <Badge key={cat} variant="secondary">
                {cat}
              </Badge>
            ))}
            {tab === "edit" &&
              creator.edit_softwares?.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              About {tab === "edit" ? "editing" : "coverage"}
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-foreground/90">
              {bio}
            </p>
          </section>

          <PortfolioGallery
            works={creator.works}
            mode={tab}
            creatorName={creator.full_name}
          />

          <ExternalLinksSection links={creator.links} />

          <ReviewsSection
            creatorId={creator.id}
            rating={creator.rating}
            reviewCount={creator.review_count}
          />
        </div>

        <aside className="h-fit space-y-4 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-20">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Packages from
            </p>
            <p className="mt-1 text-2xl font-semibold text-gold">
              {priceLabelFrom(price)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Category package floors — not hourly. Final quote depends on
              scope &amp; deliverables.
            </p>
          </div>

          {Object.keys(creator.category_prices || {}).length > 0 && (
            <div className="rounded-lg border border-border/80 bg-background/50 p-3">
              <p className="text-xs font-medium text-foreground">By category</p>
              <ul className="mt-2 space-y-1.5">
                {Object.entries(creator.category_prices)
                  .filter(([, p]) => p > 0)
                  .sort((a, b) => a[1] - b[1])
                  .map(([cat, p]) => (
                    <li
                      key={cat}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-muted-foreground">{cat}</span>
                      <span className="font-medium tabular-nums">
                        From {formatPriceInr(p)}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <SendBriefButton
            creator={creator}
            surface={tab}
            defaultBriefType={defaultBriefType}
            size="lg"
            className="w-full"
            label="Send brief"
          />

          <ProfileShareCard
            listingId={creator.id}
            creatorName={creator.full_name}
            compact
          />

          <div className="flex items-start gap-2 rounded-lg border border-border/80 bg-background/50 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p>
              Phone number is not public. After they accept your brief,{" "}
              <span className="text-foreground">they</span> message you on
              WhatsApp. Save your details once to autofill later.
            </p>
          </div>

          <div className="rounded-lg border border-border/80 bg-background/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Services</p>
            <p className="mt-1">
              {creator.service_modes
                .map((m) =>
                  m === "shoot" ? "Event coverage" : "Editing / post"
                )
                .join(" · ")}
            </p>
            <p className="mt-2 font-medium text-foreground">Areas</p>
            <p className="mt-1">{creator.sub_regions.join(", ")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
