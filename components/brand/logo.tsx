import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string | null;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

/** ROLLR mark — gold square with film-frame R */
export function LogoMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-11 w-11" : size === "md" ? "h-9 w-9" : "h-7 w-7";
  const letter =
    size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-[11px]";
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/35",
        dim,
        className
      )}
      aria-hidden
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)",
        }}
      />
      {/* Film sprocket dots */}
      <span className="absolute left-0.5 top-1 h-1 w-1 rounded-full bg-primary-foreground/40" />
      <span className="absolute left-0.5 bottom-1 h-1 w-1 rounded-full bg-primary-foreground/40" />
      <span className="absolute right-0.5 top-1 h-1 w-1 rounded-full bg-primary-foreground/40" />
      <span className="absolute right-0.5 bottom-1 h-1 w-1 rounded-full bg-primary-foreground/40" />
      <span
        className={cn(
          "relative font-bold tracking-tighter text-primary-foreground",
          letter
        )}
      >
        R
      </span>
    </span>
  );
}

export function Logo({
  className,
  href = "/",
  showWordmark = true,
  size = "md",
}: LogoProps) {
  const word =
    size === "lg" ? "text-xl" : size === "md" ? "text-lg" : "text-sm";
  const inner = (
    <span className={cn("group inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          className={cn(
            "font-semibold tracking-[0.18em] text-foreground transition-colors group-hover:text-primary",
            word
          )}
        >
          ROLLR
        </span>
      )}
    </span>
  );

  if (href === null) return inner;
  return (
    <Link
      href={href}
      className="shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {inner}
    </Link>
  );
}
