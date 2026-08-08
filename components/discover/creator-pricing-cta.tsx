import Link from "next/link";
import { ArrowRight, IndianRupee, Percent, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CreatorPricingCtaProps = {
  /** Compact card for hero top-right */
  variant?: "hero" | "banner";
  className?: string;
};

export function CreatorPricingCta({
  variant = "hero",
  className,
}: CreatorPricingCtaProps) {
  if (variant === "hero") {
    return (
      <aside
        id="for-creators"
        className={cn(
          "pro-frame relative w-full shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-card to-card p-4 sm:max-w-sm lg:w-[20.5rem] animate-rise",
          className
        )}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/25 blur-2xl"
          aria-hidden
        />
        <div className="relative space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            For photographers &amp; editors
          </p>
          <div>
            <p className="text-sm font-semibold leading-snug tracking-tight text-foreground">
              List on ROLLR for{" "}
              <span className="text-primary">₹299/mo</span>
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Get in front of Mumbai clients. Keep every rupee you invoice — 0%
              commission on bookings.
            </p>
          </div>
          <ul className="space-y-1.5 text-[11px] text-muted-foreground">
            <li className="inline-flex w-full items-center gap-1.5">
              <Percent className="h-3 w-3 shrink-0 text-primary" />
              0% commission
            </li>
            <li className="inline-flex w-full items-center gap-1.5">
              <Sparkles className="h-3 w-3 shrink-0 text-primary" />
              Unlimited briefs
            </li>
            <li className="inline-flex w-full items-center gap-1.5">
              <IndianRupee className="h-3 w-3 shrink-0 text-primary" />
              PRO badge &amp; priority
            </li>
          </ul>
          <Button
            asChild
            size="sm"
            className="w-full font-semibold shadow-sm shadow-primary/20"
          >
            <Link href="/list">
              See full plan
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <section
      id="for-creators"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-5 sm:p-7",
        className
      )}
    >
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            For photographers &amp; editors
          </p>
          <p className="mt-1 text-lg font-semibold">
            List for <span className="text-primary">₹299/mo</span> · 0% commission
          </p>
        </div>
        <Button asChild className="font-semibold">
          <Link href="/list">
            See full plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
