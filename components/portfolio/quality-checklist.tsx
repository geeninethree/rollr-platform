import { Check, Circle } from "lucide-react";
import { qualityChecks } from "@/lib/portfolio";
import type { CreatorCardModel } from "@/lib/types";
import { cn } from "@/lib/utils";

type QualityChecklistProps = {
  creator: Pick<
    CreatorCardModel,
    | "full_name"
    | "bio"
    | "avatar_url"
    | "cover_url"
    | "works"
    | "links"
    | "service_modes"
    | "categories"
    | "sub_regions"
    | "tagline"
  >;
  score: number;
};

export function QualityChecklist({ creator, score }: QualityChecklistProps) {
  const checks = qualityChecks(creator);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Listing quality</p>
        <p className="text-sm font-semibold tabular-nums text-primary">
          {score}/100
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-xs">
            {c.ok ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <Circle
                className={cn(
                  "mt-0.5 h-3.5 w-3.5 shrink-0",
                  c.required ? "text-muted-foreground" : "text-muted-foreground/50"
                )}
              />
            )}
            <span
              className={cn(
                c.ok ? "text-foreground" : "text-muted-foreground",
                !c.required && !c.ok && "opacity-80"
              )}
            >
              {c.label}
              {!c.required && (
                <span className="text-muted-foreground"> (optional)</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Required checks must pass before a listing can be submitted for review.
        External links help trust but never replace on-platform work.
      </p>
    </div>
  );
}
