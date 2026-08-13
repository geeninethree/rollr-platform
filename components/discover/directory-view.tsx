"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { CreatorGrid } from "@/components/discover/creator-grid";
import {
  CreatorSignupBand,
  HeroSearch,
} from "@/components/discover/hero-search";
import { HowItWorks } from "@/components/discover/how-it-works";
import { Button } from "@/components/ui/button";
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
      {/* One shell: hero + band + grid all same width */}
      <div className="page-shell min-w-0 space-y-10 pb-16 pt-6 sm:space-y-12 sm:pb-20 sm:pt-8">
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
        />

        <CreatorSignupBand />

        <section id="directory-results" className="space-y-6 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {isEdit ? "Editors" : "Photographers"}
              </h2>
              <p className="text-sm text-white/40">
                {loading
                  ? "Loading…"
                  : `${creators.length} live listing${creators.length === 1 ? "" : "s"}`}
              </p>
            </div>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-white/40" />
            )}
          </div>

          {error && (
            <p className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {error}
            </p>
          )}

          {!loading && creators.length === 0 && !error ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-14 text-center sm:px-6 sm:py-20">
              <p className="text-base font-medium text-white sm:text-lg">
                Creators onboarding
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/45">
                Alpha: we manually review every portfolio before it goes live.
                Photographers &amp; editors — list free for now, we&apos;ll
                publish when you look solid.
              </p>
              <div className="mt-6 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
                <Button asChild className="w-full font-semibold sm:w-auto">
                  <Link href="/signup?role=creator&next=/studio">
                    List as creator
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/list">Pricing &amp; interest</Link>
                </Button>
              </div>
            </div>
          ) : (
            <CreatorGrid
              creators={creators}
              surface={mode}
              eventDate={filters.eventDate || undefined}
              onClearFilters={() => setFilters(EMPTY_FILTERS)}
              emptyTitle={
                isEdit
                  ? "No editors match"
                  : "No photographers match"
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
