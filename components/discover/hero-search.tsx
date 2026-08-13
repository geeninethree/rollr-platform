"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Search, Tag, X } from "lucide-react";
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

/**
 * Discover command bar — product control, not brochure hero.
 */
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

  return (
    <section className="relative w-full min-w-0 space-y-6 sm:space-y-8">
      {/* Title block — typography first */}
      <div className="max-w-2xl space-y-3">
        <div
          className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5 text-xs font-medium"
          role="tablist"
        >
          <Link
            href="/"
            className={cn(
              "rounded-full px-3.5 py-2 text-xs font-medium transition-product sm:py-1.5",
              !isEdit
                ? "bg-white text-black"
                : "text-white/50 hover:text-white"
            )}
          >
            Photographers
          </Link>
          <Link
            href="/editors"
            className={cn(
              "rounded-full px-3.5 py-2 text-xs font-medium transition-product sm:py-1.5",
              isEdit
                ? "bg-white text-black"
                : "text-white/50 hover:text-white"
            )}
          >
            Editors
          </Link>
        </div>

        <h1 className="text-balance text-[1.85rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-[2.6rem] lg:text-[2.85rem]">
          {isEdit ? "Find an editor" : "Find a photographer"}
        </h1>
        <p className="text-[15px] text-white/45">
          Mumbai · 0% commission
          <span className="mx-2 text-white/20">·</span>
          <span className="text-white/35">
            {loading
              ? "Loading…"
              : `${resultCount} live`}
          </span>
        </p>
      </div>

      {/* Command bar */}
      <div className="surface-panel p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="relative" ref={wrapRef}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-white/30" />
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
                  const s = suggestions[highlight];
                  if (s) applySuggestion(s);
                  else onSearch();
                } else if (e.key === "Escape") {
                  setSuggestOpen(false);
                }
              }}
              placeholder={
                isEdit
                  ? "Search editors, reels, colour…"
                  : "Search area, wedding, corporate…"
              }
              className="h-12 border-white/[0.06] bg-black/40 pl-10 text-[15px] placeholder:text-white/30 sm:h-11"
              autoComplete="off"
            />
            {suggestOpen && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-auto rounded-2xl border border-white/[0.08] bg-[#121214]/95 py-1 shadow-2xl shadow-black/60 backdrop-blur-xl">
                {suggestions.map((s, i) => (
                  <li key={`${s.kind}-${s.label}`}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm",
                        i === highlight
                          ? "bg-white/[0.08] text-white"
                          : "text-white/70 hover:bg-white/[0.04]"
                      )}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => applySuggestion(s)}
                    >
                      {s.kind === "location" ? (
                        <MapPin className="h-3.5 w-3.5 text-white/35" />
                      ) : (
                        <Tag className="h-3.5 w-3.5 text-white/35" />
                      )}
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {filters.locations.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {filters.locations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => removeLocation(loc)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/80"
                >
                  {loc}
                  <X className="h-3 w-3 opacity-60" />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {chips.map((id) => {
              const selected = filters.categories.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCategory(id)}
                  className={cn("chip", selected && "chip-active")}
                >
                  {id}
                </button>
              );
            })}
            {active && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-medium text-white/40 hover:text-white/70"
              >
                Clear
              </button>
            )}
            <div className="ml-auto">
              <Button
                type="button"
                onClick={onSearch}
                size="sm"
                className="h-9 rounded-full px-5 font-semibold"
              >
                {loading
                  ? "…"
                  : resultCount > 0
                    ? `See ${resultCount}`
                    : "See results"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Quiet creator CTA — no gradient shout */
export function CreatorSignupBand() {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-white/[0.06] bg-white/[0.02] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-white/90">
          Photographers &amp; editors
        </p>
        <p className="text-sm text-white/40">
          List free in alpha · ₹299/mo when billing starts · 0% commission
        </p>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0 font-semibold">
        <Link href="/signup?role=creator&next=/studio">List free</Link>
      </Button>
    </div>
  );
}
