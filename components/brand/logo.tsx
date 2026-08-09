import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string | null;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

/**
 * ROLLR mark — dark pill + wordmark with film-reel gold "O"
 * Matches design language from approved mock (#10).
 */
export function LogoMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-9 w-9" : size === "md" ? "h-8 w-8" : "h-7 w-7";
  const letter =
    size === "lg" ? "text-sm" : size === "md" ? "text-xs" : "text-[10px]";
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary ring-1 ring-white/10",
        dim,
        className
      )}
      aria-hidden
    >
      <span
        className={cn(
          "relative font-semibold tracking-tight text-foreground",
          letter
        )}
      >
        R
      </span>
    </span>
  );
}

/** Wordmark with gold film-reel O */
export function LogoWordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const word =
    size === "lg" ? "text-lg" : size === "md" ? "text-base" : "text-sm";
  const oSize =
    size === "lg" ? "h-[0.95em] w-[0.95em]" : size === "md" ? "h-[0.9em] w-[0.9em]" : "h-[0.85em] w-[0.85em]";

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold tracking-[0.12em] text-foreground",
        word,
        className
      )}
    >
      R
      <span
        className={cn(
          "relative mx-[0.04em] inline-flex items-center justify-center text-primary",
          oSize
        )}
        aria-hidden
      >
        {/* Film reel O */}
        <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor">
          <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <circle cx="12" cy="12" r="3.2" />
          <circle cx="12" cy="5.2" r="1.15" />
          <circle cx="12" cy="18.8" r="1.15" />
          <circle cx="5.2" cy="12" r="1.15" />
          <circle cx="18.8" cy="12" r="1.15" />
          <circle cx="7.1" cy="7.1" r="1" />
          <circle cx="16.9" cy="7.1" r="1" />
          <circle cx="7.1" cy="16.9" r="1" />
          <circle cx="16.9" cy="16.9" r="1" />
        </svg>
      </span>
      LLR
    </span>
  );
}

export function Logo({
  className,
  href = "/",
  showWordmark = true,
  size = "md",
}: LogoProps) {
  const pad =
    size === "lg" ? "px-3.5 py-2" : size === "md" ? "px-3 py-1.5" : "px-2.5 py-1";

  const inner = (
    <span
      className={cn(
        "group inline-flex items-center gap-0 rounded-full border border-white/[0.08] bg-card/90 shadow-sm shadow-black/40 transition-colors hover:border-primary/30",
        pad,
        className
      )}
    >
      {showWordmark ? (
        <LogoWordmark size={size} />
      ) : (
        <LogoMark size={size} />
      )}
    </span>
  );

  if (href === null) return inner;
  return (
    <Link
      href={href}
      className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {inner}
    </Link>
  );
}
