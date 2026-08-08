import { Badge } from "@/components/ui/badge";
import { listingStatusLabel } from "@/lib/portfolio";
import type { ListingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ListingStatusBadge({
  status,
  className,
}: {
  status: ListingStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-medium",
        status === "published" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
        status === "pending_review" &&
          "border-amber-500/40 bg-amber-500/10 text-amber-400",
        status === "draft" && "border-border text-muted-foreground",
        status === "rejected" &&
          "border-destructive/40 bg-destructive/10 text-destructive",
        className
      )}
    >
      {listingStatusLabel(status)}
    </Badge>
  );
}
