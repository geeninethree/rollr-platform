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
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-product",
                  active && "border-transparent bg-white text-black",
                  !active &&
                    done &&
                    "border-white/15 bg-white/[0.06] text-white/80",
                  !active &&
                    !done &&
                    "border-white/10 bg-transparent text-white/40",
                  hasIssue && !active && "border-destructive/40 text-destructive"
                )}
              >
                <span className="tabular-nums">{step.number}</span>
                {step.short}
                {done && !active && <Check className="h-3 w-3" />}
                {hasIssue && !active && <CircleAlert className="h-3 w-3" />}
              </button>
            </li>
          );
        })}
      </ol>

      <ol className="hidden sm:grid sm:grid-cols-6 sm:gap-1.5">
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
                  "flex w-full flex-col gap-1 rounded-2xl border px-2.5 py-2.5 text-left transition-product",
                  active && "border-white/15 bg-white/[0.08]",
                  !active &&
                    done &&
                    "border-white/[0.06] bg-white/[0.03] hover:border-white/12",
                  !active &&
                    !done &&
                    "border-white/[0.04] bg-transparent hover:border-white/10",
                  hasIssue && !active && "border-destructive/30 bg-destructive/5"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                      active && "bg-white text-black",
                      !active && done && "bg-white/15 text-white/80",
                      !active && !done && "bg-white/[0.06] text-white/40",
                      hasIssue && !active && "bg-destructive/20 text-destructive"
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
                      "truncate text-xs font-medium",
                      active ? "text-white" : "text-white/45",
                      hasIssue && !active && "text-destructive"
                    )}
                  >
                    {step.short}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
