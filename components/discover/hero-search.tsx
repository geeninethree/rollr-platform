"use client";

import Link from "next/link";
import { Clapperboard, FileText, Search, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreatorPricingCta } from "@/components/discover/creator-pricing-cta";
import { hasActiveFilters } from "@/lib/filters";
import {
  EDIT_SPECIALTIES,
  LOCATIONS,
  SHOOT_CATEGORIES,
} from "@/lib/mock-data";
import type { SearchFilters, ServiceMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type HeroSearchProps = {
  mode: ServiceMode;
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  onSearch: () => void;
  onClear: () => void;
  resultCount: number;
};

function toggleInList(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function HeroSearch({
  mode,
  filters,
  onChange,
  onSearch,
  onClear,
  resultCount,
}: HeroSearchProps) {
  const active = hasActiveFilters(filters, mode);
  const isEdit = mode === "edit";
  const categoryPool = isEdit ? [...EDIT_SPECIALTIES] : [...SHOOT_CATEGORIES];

  const quickChips = isEdit
    ? [
        { id: "Wedding film", kind: "category" as const },
        { id: "Reels / vertical", kind: "category" as const },
        { id: "Colour grade", kind: "category" as const },
        { id: "Under ₹15k", kind: "under15k" as const },
        { id: "Also shoots", kind: "alsoShoots" as const },
      ]
    : [
        { id: "Wedding", kind: "category" as const },
        { id: "Nightclub", kind: "category" as const },
        { id: "Corporate", kind: "category" as const },
        { id: "Under ₹15k", kind: "under15k" as const },
        { id: "Also edits", kind: "alsoEdits" as const },
      ];

  return (
    <section className="space-y-5">
      {/* Headline left · creator pricing card top-right */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="max-w-xl space-y-2">
            <p className="text-overline text-primary">
              Mumbai · 0% commission
            </p>
            <h1 className="text-balance font-semibold tracking-tight">
              {isEdit
                ? "Hire editors & colourists"
                : "Book photographers & videographers"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {resultCount} creators · open a profile to send a brief
            </p>
          </div>

          <div
            className="flex max-w-md rounded-xl border border-border bg-card p-1 shadow-sm"
            role="tablist"
            aria-label="Directory section"
          >
            <Link
              href="/"
              role="tab"
              aria-selected={!isEdit}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                !isEdit
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Video className="h-4 w-4" />
              Photographers
            </Link>
            <Link
              href="/editors"
              role="tab"
              aria-selected={isEdit}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                isEdit
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Clapperboard className="h-4 w-4" />
              Editors
            </Link>
          </div>
        </div>

        <CreatorPricingCta variant="hero" />
      </div>

      {/* High-impact search panel */}
      <div className="rounded-2xl border-2 border-primary/25 bg-card p-4 shadow-[0_0_0_1px_hsl(var(--primary)/0.08),0_16px_40px_-20px_hsl(var(--primary)/0.35)] sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Find {isEdit ? "an editor" : "a photographer"}
          </p>
          <span className="text-xs tabular-nums text-muted-foreground">
            {resultCount} available
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.15fr_0.95fr_1.15fr_auto]">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Location
            </label>
            <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-input bg-background p-2">
              {LOCATIONS.map((loc) => {
                const selected = filters.locations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...filters,
                        locations: toggleInList(filters.locations, loc),
                      })
                    }
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="event-date"
              className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              Event date
            </label>
            <Input
              id="event-date"
              type="date"
              value={filters.eventDate}
              onChange={(e) =>
                onChange({ ...filters, eventDate: e.target.value })
              }
              className="h-10 bg-background text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {isEdit ? "Specialty" : "Category"}
            </label>
            <div className="flex max-h-16 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-input bg-background p-2">
              {categoryPool.map((cat) => {
                const selected = filters.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...filters,
                        categories: toggleInList(filters.categories, cat),
                      })
                    }
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-end">
            {active && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="h-10 w-10 shrink-0 text-muted-foreground"
                aria-label="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              onClick={onSearch}
              size="lg"
              className="h-10 min-w-[7.5rem] font-semibold"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button
              asChild
              type="button"
              variant="outline"
              size="lg"
              className="h-10 min-w-[7.5rem] font-semibold"
            >
              <Link href="/job-board">
                <FileText className="h-4 w-4" />
                Post a brief
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Quick
          </span>
          {quickChips.map((chip) => {
            let selected = false;
            if (chip.kind === "category") {
              selected = filters.categories.includes(chip.id);
            } else if (chip.kind === "under15k") {
              selected = filters.under15k;
            } else if (chip.kind === "alsoEdits") {
              selected = filters.alsoEdits;
            } else if (chip.kind === "alsoShoots") {
              selected = filters.alsoShoots;
            }

            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  if (chip.kind === "category") {
                    onChange({
                      ...filters,
                      categories: toggleInList(filters.categories, chip.id),
                    });
                  } else if (chip.kind === "under15k") {
                    onChange({ ...filters, under15k: !filters.under15k });
                  } else if (chip.kind === "alsoEdits") {
                    onChange({ ...filters, alsoEdits: !filters.alsoEdits });
                  } else if (chip.kind === "alsoShoots") {
                    onChange({ ...filters, alsoShoots: !filters.alsoShoots });
                  }
                }}
              >
                <Badge
                  variant={selected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    selected &&
                      "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {chip.id}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
