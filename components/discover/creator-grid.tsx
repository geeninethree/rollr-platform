import { CreatorCard } from "@/components/creators/creator-card";
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
  emptyTitle = "No creators match these filters",
  emptyBody = "Try another neighbourhood, category, or clear filters.",
}: CreatorGridProps) {
  if (creators.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <p className="text-base font-medium text-foreground">{emptyTitle}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {emptyBody}
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {creators.map((creator, i) => (
        <CreatorCard
          key={creator.id}
          creator={creator}
          surface={surface}
          eventDate={eventDate}
          index={i}
        />
      ))}
    </div>
  );
}
