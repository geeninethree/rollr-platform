"use client";

import { Check, CircleAlert } from "lucide-react";
import {
  STUDIO_STEPS,
  isStepComplete,
  type StudioStepId,
} from "@/lib/studio-steps";
import type { StudioDraft } from "@/lib/studio";
import { cn } from "@/lib/utils";

type StudioStepperProps = {
  current: StudioStepId;
  draft: StudioDraft;
  onSelect: (id: StudioStepId) => void;
};

export function StudioStepper({ current, draft, onSelect }: StudioStepperProps) {
  const currentIdx = STUDIO_STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Portfolio steps" className="w-full min-w-0">
      {/* Mobile: horizontal chips */}
      <ol className="flex gap-1.5 overflow-x-auto pb-1 sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STUDIO_STEPS.map((step, i) => {
          const done = isStepComplete(step.id, draft);
          const active = step.id === current;
          const hasIssue = !done && i < currentIdx;
          return (
            <li key={step.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active &&
                    "border-primary bg-primary text-primary-foreground",
                  !active &&
                    done &&
                    "border-primary/40 bg-primary/10 text-foreground",
                  !active &&
                    !done &&
                    "border-border bg-secondary text-muted-foreground",
                  hasIssue && !active && "border-destructive/50 text-destructive"
                )}
              >
                <span className="tabular-nums">{step.number}</span>
                {step.short}
                {done && !active && <Check className="h-3 w-3" />}
                {hasIssue && !active && (
                  <CircleAlert className="h-3 w-3" />
                )}
              </button>
            </li>
          );
        })}
      </ol>

      {/* Desktop: full step bar */}
      <ol className="hidden sm:grid sm:grid-cols-6 sm:gap-2">
        {STUDIO_STEPS.map((step, i) => {
          const done = isStepComplete(step.id, draft);
          const active = step.id === current;
          const hasIssue = !done && i < currentIdx;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                className={cn(
                  "flex w-full flex-col gap-1.5 rounded-xl border px-2.5 py-2.5 text-left transition-colors",
                  active && "border-primary bg-primary/10",
                  !active && done && "border-border bg-card/80 hover:border-primary/40",
                  !active &&
                    !done &&
                    "border-border/80 bg-card/40 hover:border-border",
                  hasIssue && !active && "border-destructive/40 bg-destructive/5"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                      active && "bg-primary text-primary-foreground",
                      !active && done && "bg-primary/20 text-primary",
                      !active &&
                        !done &&
                        "bg-secondary text-muted-foreground",
                      hasIssue &&
                        !active &&
                        "bg-destructive/20 text-destructive"
                    )}
                  >
                    {done && !active ? (
                      <Check className="h-3 w-3" />
                    ) : hasIssue && !active ? (
                      <CircleAlert className="h-3 w-3" />
                    ) : (
                      step.number
                    )}
                  </span>
                  <span
                    className={cn(
                      "truncate text-xs font-semibold",
                      active ? "text-foreground" : "text-muted-foreground",
                      hasIssue && !active && "text-destructive"
                    )}
                  >
                    {step.short}
                  </span>
                </span>
                <span className="line-clamp-1 text-[10px] text-muted-foreground">
                  {done ? "Looks good" : hasIssue ? "Needs attention" : "Pending"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
