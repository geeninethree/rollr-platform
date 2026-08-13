"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Search, Sparkles, Tag, X } from "lucide-react";
// Sparkles used by CreatorSignupBand
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasActiveFilters } from "@/lib/filters";
import {
  EDIT_SPECIALTIES,
  matchLocations,
  SHOOT_CATEGORIES,
} from "@/lib/mock-data";
import type { SearchFilters, ServiceMode } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Contained hero photos — CSS background only (never layout-stretch) */
const HERO_SHOOT =
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80";
const HERO_EDIT =
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1600&q=80";

const SHOOT_CHIPS = ["Wedding", "Corporate", "Portraits", "Nightclub"] as const;
const EDIT_CHIPS = [
  "Wedding film",
  "Reels / vertical",
  "Colour grade",
  "Corporate highlight",
] as const;

type HeroSearchProps = {
  mode: ServiceMode;
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  onSearch: () => void;
  onClear: () => void;
  resultCount: number;
  loading?: boolean;
};

type Suggestion =
  | { kind: "location"; label: string }
  | { kind: "category"; label: string };

export function HeroSearch({
  mode,
  filters,
  onChange,
  onSearch,
  onClear,
  loading = false,
  resultCount,
}: HeroSearchProps) {
  const active = hasActiveFilters(filters, mode);
  const isEdit = mode === "edit";
  const chips = isEdit ? EDIT_CHIPS : SHOOT_CHIPS;

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo((): Suggestion[] => {
    const q = filters.query.trim();
    const categoryPool = isEdit
      ? [...EDIT_SPECIALTIES]
      : [...SHOOT_CATEGORIES];

    const locs = matchLocations(q, 6).map((label) => ({
      kind: "location" as const,
      label,
    }));

    if (q.length < 1) return locs;

    const ql = q.toLowerCase();
    const cats = categoryPool
      .filter((c) => c.toLowerCase().includes(ql))
      .map((label) => ({ kind: "category" as const, label }));

    return [...locs, ...cats].slice(0, 8);
  }, [filters.query, isEdit]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [filters.query, suggestOpen]);

  function toggleCategory(id: string) {
    const has = filters.categories.includes(id);
    onChange({
      ...filters,
      categories: has
        ? filters.categories.filter((c) => c !== id)
        : [...filters.categories, id],
    });
  }

  function applySuggestion(s: Suggestion) {
    if (s.kind === "location") {
      const has = filters.locations.includes(s.label);
      onChange({
        ...filters,
        query: "",
        locations: has
          ? filters.locations.filter((l) => l !== s.label)
          : [...filters.locations, s.label],
      });
    } else {
      const has = filters.categories.includes(s.label);
      onChange({
        ...filters,
        query: "",
        categories: has
          ? filters.categories.filter((c) => c !== s.label)
          : [...filters.categories, s.label],
      });
    }
    setSuggestOpen(false);
  }

  function removeLocation(loc: string) {
    onChange({
      ...filters,
      locations: filters.locations.filter((l) => l !== loc),
    });
  }

  const heroUrl = isEdit ? HERO_EDIT : HERO_SHOOT;

  return (
    /* Parent directory-view already has page-shell — do not nest another */
    <section className="relative w-full min-w-0 max-w-full">
      {/* Contained wide hero — fixed box, CSS cover only (no next/image fill) */}
      <div
        className={cn(
          "w-full min-w-0 overflow-hidden rounded-2xl border border-white/[0.08]",
          "bg-[hsl(240_5%_7%)] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)]"
        )}
      >
        <div className="grid min-w-0 lg:grid-cols-2">
          {/*
            Fixed height + max-height — photo is a BACKGROUND, not a layout child.
            This is the only reliable way to stop full-page stretch glitches.
          */}
          <div
            className="media-frame relative h-[180px] w-full max-h-[36vh] min-h-[160px] sm:h-[300px] sm:max-h-[46vh] lg:h-[400px] lg:max-h-none"
            role="img"
            aria-label={isEdit ? "Editor workspace" : "Photography"}
            style={{
              backgroundColor: "hsl(240 5% 8%)",
              backgroundImage: `url(${heroUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 z-[1]"
              style={{
                background: [
                  "linear-gradient(to right, transparent 55%, hsl(240 5% 7% / 0.9) 100%)",
                  "linear-gradient(to top, hsl(240 5% 7% / 0.55) 0%, transparent 45%)",
                ].join(", "),
              }}
            />
          </div>

          <div className="flex min-w-0 flex-col justify-center gap-4 px-4 py-6 sm:gap-6 sm:px-8 sm:py-10 lg:min-h-[400px] lg:px-10">
            <div className="space-y-2.5 sm:space-y-3">
              <div
                className="inline-flex max-w-full rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5 text-xs font-medium"
                role="tablist"
              >
                <Link
                  href="/"
                  className={cn(
                    "rounded-full px-3 py-2 transition-colors sm:px-3.5 sm:py-1.5",
                    !isEdit
                      ? "bg-white text-black"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Photographers
                </Link>
                <Link
                  href="/editors"
                  className={cn(
                    "rounded-full px-3 py-2 transition-colors sm:px-3.5 sm:py-1.5",
                    isEdit
                      ? "bg-white text-black"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Editors
                </Link>
              </div>

              <h1 className="text-balance text-[1.65rem] font-semibold leading-[1.1] tracking-tight text-white sm:text-[2.5rem] lg:text-[2.75rem]">
                {isEdit ? "Find an editor" : "Find a photographer"}
              </h1>
              <p className="text-sm text-white/50 sm:text-[15px]">
                Mumbai · 0% commission
              </p>
              <p className="text-xs text-white/40 sm:text-sm">
                {loading
                  ? "Loading listings…"
                  : `${resultCount} available · send a brief from any profile`}
              </p>
            </div>

            <div className="space-y-4">
              {/* Search + suggestions */}
              <div className="relative" ref={wrapRef}>
                <Search className="pointer-events-none absolute left-4 top-3.5 z-[1] h-4 w-4 text-white/35" />
                <Input
                  value={filters.query}
                  onChange={(e) => {
                    onChange({ ...filters, query: e.target.value });
                    setSuggestOpen(true);
                  }}
                  onFocus={() => setSuggestOpen(true)}
                  onKeyDown={(e) => {
                    if (!suggestOpen || suggestions.length === 0) {
                      if (e.key === "Enter") onSearch();
                      return;
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlight((h) =>
                        Math.min(h + 1, suggestions.length - 1)
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlight((h) => Math.max(h - 1, 0));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      applySuggestion(suggestions[highlight]);
                      onSearch();
                    } else if (e.key === "Escape") {
                      setSuggestOpen(false);
                    }
                  }}
                  placeholder="Name, style, or area (e.g. Bandra)"
                  className="h-11 rounded-full border-white/[0.08] bg-white/[0.04] pl-11 pr-12 text-base text-white placeholder:text-white/30 focus-visible:ring-primary/40 sm:h-12 sm:text-[15px]"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={suggestOpen}
                  aria-controls="search-suggestions"
                />
                {active && (
                  <button
                    type="button"
                    onClick={() => {
                      onClear();
                      setSuggestOpen(false);
                    }}
                    className="absolute right-3 top-3 z-[1] rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                    aria-label="Clear"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {suggestOpen && suggestions.length > 0 && (
                  <ul
                    id="search-suggestions"
                    role="listbox"
                    className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#141416] py-1.5 shadow-2xl shadow-black/60"
                  >
                    {suggestions.map((s, i) => (
                      <li key={`${s.kind}-${s.label}`} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={i === highlight}
                          onMouseEnter={() => setHighlight(i)}
                          onClick={() => {
                            applySuggestion(s);
                            onSearch();
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors",
                            i === highlight
                              ? "bg-white/[0.08] text-white"
                              : "text-white/70 hover:bg-white/[0.05]"
                          )}
                        >
                          {s.kind === "location" ? (
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                          ) : (
                            <Tag className="h-3.5 w-3.5 shrink-0 text-primary" />
                          )}
                          <span className="min-w-0 flex-1 truncate">
                            {s.label}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide text-white/30">
                            {s.kind === "location" ? "Area" : "Category"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Selected areas */}
              {filters.locations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {filters.locations.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => removeLocation(loc)}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary"
                    >
                      <MapPin className="h-3 w-3" />
                      {loc}
                      <X className="h-3 w-3 opacity-70" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {chips.map((id) => {
                  const selected = filters.categories.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleCategory(id)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-white/[0.1] bg-transparent text-white/55 hover:border-white/20 hover:text-white/90"
                      )}
                    >
                      {id}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  type="button"
                  onClick={onSearch}
                  size="lg"
                  className="h-11 rounded-full px-8 font-semibold"
                >
                  {loading
                    ? "Loading…"
                    : resultCount > 0
                      ? `See ${resultCount} result${resultCount === 1 ? "" : "s"}`
                      : "See results"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Creator band — use inside `.page-shell` so width matches the grid */
export function CreatorSignupBand() {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/25",
        "bg-gradient-to-br from-primary/[0.12] via-[hsl(240_5%_8%)] to-[hsl(240_6%_5%)]",
        "px-5 py-5 sm:px-7 sm:py-6"
      )}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-base font-semibold tracking-tight text-white sm:text-lg">
              Photographers &amp; editors — list on ROLLR
            </p>
            <p className="max-w-xl text-sm text-white/50">
              Unlimited briefs. Zero commission.{" "}
              <span className="text-primary">
                List free in alpha · ₹299/mo when billing starts
              </span>
              .
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild size="lg" className="h-11 font-semibold">
            <Link href="/signup?role=creator&next=/studio">
              Sign up as creator
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-11 font-semibold"
          >
            <Link href="/list">See pricing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
