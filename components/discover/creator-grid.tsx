import { CreatorCard } from "@/components/creators/creator-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { CreatorCardModel, ServiceMode } from "@/lib/types";

type CreatorGridProps = {
  creators: CreatorCardModel[];
  surface?: ServiceMode;
  eventDate?: string;
  onClearFilters?: () => void;
  emptyTitle?: string;
  emptyBody?: string;
};

export function CreatorGrid({
  creators,
  surface = "shoot",
  eventDate,
  onClearFilters,
  emptyTitle = "No creators match",
  emptyBody = "Try another area, category, or clear filters.",
}: CreatorGridProps) {
  if (creators.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState title={emptyTitle} body={emptyBody} className="py-14" />
        {onClearFilters && (
          <div className="text-center">
            <button
              type="button"
              onClick={onClearFilters}
              className="text-sm font-medium text-white/50 transition-colors hover:text-white"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
      {creators.map((creator, i) => (
        <div key={creator.id} className="min-w-0">
          <CreatorCard
            creator={creator}
            surface={surface}
            eventDate={eventDate}
            index={i}
          />
        </div>
      ))}
    </div>
  );
}
