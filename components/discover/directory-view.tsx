"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { CreatorGrid } from "@/components/discover/creator-grid";
import { HeroSearch } from "@/components/discover/hero-search";
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
          setError("Supabase is not configured.");
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
    <div className="bg-grid-fade">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
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

        <section id="directory-results" className="space-y-4 scroll-mt-20">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight sm:text-lg">
                {isEdit ? "Editors in Mumbai" : "Photographers in Mumbai"}
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Live listings · open a profile to send a brief
              </p>
            </div>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </span>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {error}
              {(error.includes("column") || error.includes("schema")) &&
                " — run migrations 00003 and 00004 in the Supabase SQL Editor."}
            </p>
          )}

          {!loading && creators.length === 0 && !error ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
              <p className="text-base font-medium text-foreground">
                No published creators yet
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Be the first. Sign up as a creator, build your listing in Studio,
                and hit Save &amp; publish.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button asChild className="font-semibold">
                  <Link href="/signup?next=/studio">Sign up as creator</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/studio">Open Studio</Link>
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
                  ? "No editors match these filters"
                  : "No photographers match these filters"
              }
            />
          )}
        </section>

        <HowItWorks />
      </div>
    </div>
  );
}
