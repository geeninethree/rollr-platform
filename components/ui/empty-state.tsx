import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  body: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  className?: string;
};

/**
 * One empty pattern for the whole product — calm, single primary action.
 */
export function EmptyState({
  title,
  body,
  primary,
  secondary,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-white/[0.08]",
        "bg-white/[0.015] px-6 py-16 text-center sm:px-10 sm:py-20",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(42_40%_40%/0.06),transparent_70%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-md space-y-3">
        <h3 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-white/45">{body}</p>
        {(primary || secondary) && (
          <div className="flex flex-col items-stretch justify-center gap-2 pt-4 sm:flex-row sm:items-center">
            {primary && (
              <Button asChild className="font-semibold">
                <Link href={primary.href}>{primary.label}</Link>
              </Button>
            )}
            {secondary && (
              <Button asChild variant="ghost" className="text-white/60">
                <Link href={secondary.href}>{secondary.label}</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
