"use client";

import { useMemo, useState } from "react";
import { CreatorGrid } from "@/components/discover/creator-grid";
import { HeroSearch } from "@/components/discover/hero-search";
import { HowItWorks } from "@/components/discover/how-it-works";
import { EMPTY_FILTERS, filterCreators } from "@/lib/filters";
import { MOCK_CREATORS } from "@/lib/mock-data";
import type { SearchFilters, ServiceMode } from "@/lib/types";

type DirectoryViewProps = {
  mode: ServiceMode;
};

export function DirectoryView({ mode }: DirectoryViewProps) {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const isEdit = mode === "edit";

  const creators = useMemo(
    () => filterCreators(MOCK_CREATORS, filters, mode),
    [filters, mode]
  );

  return (
    <div className="bg-grid-fade">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero + impact search + section tabs */}
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

        {/* Creators immediately — not buried under copy */}
        <section id="directory-results" className="space-y-4 scroll-mt-20">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">
              {isEdit ? "Editors in Mumbai" : "Photographers in Mumbai"}
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Open a profile to send a brief
            </p>
          </div>
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
        </section>

        {/* Dual how-it-works — clients + creators */}
        <HowItWorks />
      </div>
    </div>
  );
}
