"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clapperboard, MapPin, Star, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  displayPriceForMode,
  initials,
  isHybrid,
  priceLabelFrom,
} from "@/lib/format";
import { coverForMode, featuredWorks, workCount } from "@/lib/portfolio";
import type { CreatorCardModel, ServiceMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type CreatorCardProps = {
  creator: CreatorCardModel;
  surface?: ServiceMode;
  eventDate?: string;
  /** Stagger entrance animation index (0-based) */
  index?: number;
};

export function CreatorCard({
  creator,
  surface = "shoot",
  index = 0,
}: CreatorCardProps) {
  const hybrid = isHybrid(creator);
  const isEditSurface = surface === "edit";

  const tagline = isEditSurface
    ? (creator.edit_tagline ?? creator.tagline)
    : creator.tagline;
  const bio = isEditSurface
    ? (creator.edit_bio ?? creator.bio)
    : creator.bio;
  const price = displayPriceForMode(creator, surface);
  const cover = coverForMode(creator, surface);
  const thumbs = featuredWorks(creator.works, surface, 3);
  const tags = isEditSurface
    ? (creator.edit_specialties ?? creator.categories)
    : creator.categories;
  const count = workCount(creator, surface);

  const profileHref = isEditSurface
    ? `/creators/${creator.id}?tab=edit`
    : `/creators/${creator.id}`;

  const delayClass =
    index % 6 === 0
      ? "animate-rise-delay-1"
      : index % 6 === 1
        ? "animate-rise-delay-2"
        : index % 6 === 2
          ? "animate-rise-delay-3"
          : index % 6 === 3
            ? "animate-rise-delay-4"
            : index % 6 === 4
              ? "animate-rise-delay-5"
              : "animate-rise-delay-6";

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg hover:shadow-black/20 animate-rise",
        delayClass
      )}
    >
      <Link
        href={profileHref}
        className="absolute inset-0 z-10 rounded-[inherit]"
        aria-label={`View ${creator.full_name}'s profile`}
      />

      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        <div className="skeleton absolute inset-0 rounded-none" aria-hidden />
        <Image
          src={cover}
          alt={`${creator.full_name} portfolio cover`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

        <div className="absolute right-3 top-3 z-[1] flex flex-col items-end gap-1.5">
          {hybrid && (
            <Badge
              variant="secondary"
              className="border border-border/80 bg-background/85 text-[10px] font-medium backdrop-blur-sm"
            >
              {isEditSurface ? (
                <span className="inline-flex items-center gap-1">
                  <Video className="h-3 w-3" /> Also shoots
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Clapperboard className="h-3 w-3" /> Also edits
                </span>
              )}
            </Badge>
          )}
          {!hybrid && isEditSurface && (
            <Badge
              variant="outline"
              className="border-border/80 bg-background/85 text-[10px] backdrop-blur-sm"
            >
              Edit only
            </Badge>
          )}
        </div>

        <div className="absolute bottom-3 left-3 z-[1] flex items-end gap-2.5">
          <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-background shadow-md">
            {creator.avatar_url ? (
              <Image
                src={creator.avatar_url}
                alt={creator.full_name}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary text-xs font-semibold">
                {initials(creator.full_name)}
              </div>
            )}
          </div>
          <div className="min-w-0 pb-0.5">
            <p className="truncate text-sm font-semibold text-foreground drop-shadow">
              {creator.full_name}
            </p>
            <p className="truncate text-xs text-zinc-300">{tagline}</p>
          </div>
        </div>
      </div>

      <CardContent className="relative z-[1] flex flex-1 flex-col gap-3 p-4 pointer-events-none">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gold">
            {priceLabelFrom(price)}
            <span className="ml-1 text-[10px] font-normal text-muted-foreground">
              pkg
            </span>
          </p>
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="font-medium text-foreground">
              {creator.review_count > 0
                ? creator.rating.toFixed(1)
                : "New"}
            </span>
            {creator.review_count > 0 && (
              <span>({creator.review_count})</span>
            )}
          </div>
        </div>

        {isEditSurface && creator.turnaround_label && (
          <p className="text-xs text-muted-foreground">
            {creator.turnaround_label}
          </p>
        )}

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {bio}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/80" />
          <span className="truncate">
            {creator.sub_regions.slice(0, 3).join(" · ")}
            {creator.sub_regions.length > 3 ? " +" : ""}
          </span>
          <span className="text-border">·</span>
          <span>{count} works</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className="rounded-md px-1.5 py-0 text-[10px] font-medium"
            >
              {cat}
            </Badge>
          ))}
        </div>

        <div className="mt-auto grid grid-cols-3 gap-1.5 pt-1">
          {thumbs.map((item, i) => (
            <div
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-md bg-secondary"
            >
              <Image
                src={item.url}
                alt={`${creator.full_name} work sample ${i + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="relative z-[1] border-t border-border/60 p-3 pointer-events-none">
        <Button
          asChild
          size="sm"
          className="w-full font-semibold pointer-events-auto"
        >
          <Link href={profileHref}>
            View profile
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
