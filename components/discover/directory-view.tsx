"use client";

import { useEffect, useMemo, useState } from "react";
import { CreatorGrid } from "@/components/discover/creator-grid";
import {
  CreatorSignupBand,
  HeroSearch,
} from "@/components/discover/hero-search";
import { HowItWorks } from "@/components/discover/how-it-works";
import { EmptyState } from "@/components/ui/empty-state";
import { CreatorCardSkeleton } from "@/components/ui/skeleton";
import { fetchPublishedCreators } from "@/lib/directory";
import { EMPTY_FILTERS, filterCreators } from "@/lib/filters";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CreatorCardModel, SearchFilters, ServiceMode } from "@/lib/types";

type DirectoryViewProps = {
  mode: ServiceMode;
};

export function DirectoryView({ mode }: DirectoryViewProps) {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [live, setLive] = useState<CreatorCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isEdit = mode === "edit";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (!cancelled) {
          setLive([]);
          setError("We’re having trouble connecting. Please try again.");
          setLoading(false);
        }
        return;
      }
      const { creators, error: err } = await fetchPublishedCreators(supabase);
      if (cancelled) return;
      if (err) setError(err);
      setLive(creators);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const creators = useMemo(
    () => filterCreators(live, filters, mode),
    [live, filters, mode]
  );

  return (
    <div className="bg-grid-fade max-w-[100vw] overflow-x-hidden">
      <div className="page-shell min-w-0 space-y-10 pb-20 pt-8 sm:space-y-12 sm:pb-24 sm:pt-10">
        <HeroSearch
          mode={mode}
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(EMPTY_FILTERS)}
          onSearch={() => {
            document
              .getElementById("directory-results")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          resultCount={creators.length}
          loading={loading}
        />

        {/* Only show band when empty or still loading — calm when grid is full */}
        {(loading || live.length === 0) && <CreatorSignupBand />}

        <section
          id="directory-results"
          className="space-y-5 scroll-mt-28"
          aria-busy={loading}
        >
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/35">
              {isEdit ? "Editors" : "Photographers"}
            </h2>
            {!loading && (
              <p className="text-xs tabular-nums text-white/30">
                {creators.length}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-100/90">
              {error}
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CreatorCardSkeleton key={i} />
              ))}
            </div>
          ) : creators.length === 0 && !error ? (
            <EmptyState
              title="Creators onboarding"
              body="We review every portfolio before it goes live. List free in alpha · ₹299/mo when billing starts."
              primary={{
                label: "List as creator",
                href: "/signup?role=creator&next=/studio",
              }}
              secondary={{ label: "Pricing", href: "/list" }}
            />
          ) : (
            <CreatorGrid
              creators={creators}
              surface={mode}
              eventDate={filters.eventDate || undefined}
              onClearFilters={() => setFilters(EMPTY_FILTERS)}
              emptyTitle={
                isEdit ? "No editors match" : "No photographers match"
              }
              emptyBody="Try another search or clear filters."
            />
          )}
        </section>

        <HowItWorks />
      </div>
    </div>
  );
}
