"use client";

import Image from "next/image";
import Link from "next/link";
import { Clapperboard, Star, Video } from "lucide-react";
import {
  displayPriceForMode,
  initials,
  isHybrid,
  priceLabelFrom,
} from "@/lib/format";
import { coverForMode } from "@/lib/portfolio";
import type { CreatorCardModel, ServiceMode } from "@/lib/types";
import { CoverImage } from "@/components/ui/media-frame";
import { cn } from "@/lib/utils";

type CreatorCardProps = {
  creator: CreatorCardModel;
  surface?: ServiceMode;
  eventDate?: string;
  index?: number;
};

/**
 * Photo-first card — mock 27 directory energy:
 * large still, name on image, gold price, almost no chrome.
 */
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
  const price = displayPriceForMode(creator, surface);
  const cover = coverForMode(creator, surface);

  const profileHref = isEditSurface
    ? `/creators/${creator.id}?tab=edit`
    : `/creators/${creator.id}`;

  const delay =
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
    <Link
      href={profileHref}
      className={cn(
        "group relative block min-w-0 overflow-hidden rounded-[1.25rem] border border-white/[0.06] bg-[#111113]",
        "shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)] transition-all duration-500",
        "hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-[0_28px_60px_-24px_rgba(0,0,0,0.95)]",
        "animate-rise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        delay
      )}
    >
      <div className="media-frame relative aspect-[4/5] w-full max-h-[70vh] overflow-hidden sm:aspect-[3/4] sm:max-h-none">
        <CoverImage
          src={cover}
          alt={`${creator.full_name} portfolio`}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {/* Soft film grade */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: [
              "linear-gradient(to top, hsl(0 0% 0% / 0.92) 0%, hsl(0 0% 0% / 0.45) 38%, transparent 62%)",
              "linear-gradient(to bottom, hsl(0 0% 0% / 0.25) 0%, transparent 30%)",
            ].join(", "),
          }}
        />

        {hybrid && (
          <span className="absolute right-3 top-3 z-[2] inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur-md">
            {isEditSurface ? (
              <>
                <Video className="h-3 w-3" /> Also shoots
              </>
            ) : (
              <>
                <Clapperboard className="h-3 w-3" /> Also edits
              </>
            )}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 z-[2] space-y-2 p-4 sm:p-5">
          <div className="flex items-end gap-3">
            <div className="media-frame relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20 shadow-lg">
              {creator.avatar_url ? (
                <Image
                  src={creator.avatar_url}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-secondary text-[11px] font-semibold">
                  {initials(creator.full_name)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold tracking-tight text-white">
                {creator.full_name}
              </p>
              <p className="truncate text-[12px] text-white/55">{tagline}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[15px] font-semibold text-gold">
              {priceLabelFrom(price)}
            </p>
            <span className="inline-flex items-center gap-1 text-[12px] text-white/55">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              {creator.review_count > 0
                ? `${creator.rating.toFixed(1)} (${creator.review_count})`
                : "New"}
            </span>
          </div>

          {creator.sub_regions[0] && (
            <p className="truncate text-[11px] text-white/40">
              {creator.sub_regions.slice(0, 3).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
