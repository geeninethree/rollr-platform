import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  MessageSquare,
  Percent,
  Sparkles,
} from "lucide-react";
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
          "relative w-full shrink-0 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-lg shadow-black/25 sm:max-w-sm lg:w-[20.5rem] animate-rise",
          className
        )}
      >
        <div className="relative space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            For photographers &amp; editors
          </p>
          <div>
            <p className="text-sm font-semibold leading-snug tracking-tight text-foreground">
              Unlimited briefs. Zero commission.{" "}
              <span className="text-gold">₹299/mo</span>
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Leads + business kit (quotes, invoices, rate cards). Keep every
              rupee.
            </p>
          </div>
          <ul className="space-y-1.5 text-[11px] text-muted-foreground">
            <li className="inline-flex w-full items-center gap-1.5">
              <Percent className="h-3 w-3 shrink-0 text-primary" />
              0% commission on bookings
            </li>
            <li className="inline-flex w-full items-center gap-1.5">
              <MessageSquare className="h-3 w-3 shrink-0 text-primary" />
              Unlimited client briefs
            </li>
            <li className="inline-flex w-full items-center gap-1.5">
              <Briefcase className="h-3 w-3 shrink-0 text-primary" />
              Quotes · invoices · delivery kit
            </li>
            <li className="inline-flex w-full items-center gap-1.5">
              <Sparkles className="h-3 w-3 shrink-0 text-primary" />
              Shoot + edit on one profile
            </li>
          </ul>
          <div className="flex flex-col gap-1.5">
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
            <Link
              href="/tools"
              className="text-center text-[11px] font-medium text-primary hover:underline"
            >
              Preview business kit →
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <section
      id="for-creators"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-lg shadow-black/25",
        className
      )}
    >
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            For photographers &amp; editors
          </p>
          <p className="mt-1 text-lg font-semibold">
            Unlimited briefs. Zero commission.{" "}
            <span className="text-gold">₹299/mo</span>
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
