import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const clientLinks = [
  { href: "/", label: "Photographers" },
  { href: "/editors", label: "Editors" },
  { href: "/job-board", label: "Job board" },
];

const creatorLinks = [
  { href: "/list", label: "List for ₹299/mo" },
  { href: "/studio", label: "Build listing (studio)" },
  { href: "/inbox", label: "Creator inbox (demo)" },
  { href: "/list#join", label: "Join waitlist" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="max-w-sm space-y-3">
          <Logo size="md" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Mumbai directory for photographers, videographers, and editors.
            Clients browse. Creators list for ₹299/mo with 0% commission.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            For clients
          </p>
          <ul className="space-y-2 text-sm">
            {clientLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-foreground/90 transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            For creators
          </p>
          <ul className="space-y-2 text-sm">
            {creatorLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-foreground/90 transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="pt-2 text-sm font-semibold text-primary">
            ₹299/mo · unlimited briefs · 0% cut
          </p>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} ROLLR · Mumbai POC</span>
          <span>Demo data · Briefs stay in your browser</span>
        </div>
      </div>
    </footer>
  );
}
