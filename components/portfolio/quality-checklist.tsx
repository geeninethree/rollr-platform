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
    <div className="surface-panel space-y-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/35">
          Quality
        </p>
        <p className="text-sm font-semibold tabular-nums text-primary">
          {score}
          <span className="text-white/30">/100</span>
        </p>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-[var(--ease-out-expo)]"
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
                  c.required ? "text-white/25" : "text-white/15"
                )}
              />
            )}
            <span
              className={cn(
                c.ok ? "text-white/80" : "text-white/40",
                !c.required && !c.ok && "opacity-80"
              )}
            >
              {c.label}
              {!c.required && (
                <span className="text-white/25"> · optional</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] leading-relaxed text-white/30">
        Required items must pass before submit. ROLLR reviews before you go live.
      </p>
    </div>
  );
}
