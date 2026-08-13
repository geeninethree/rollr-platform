import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const clientLinks = [
  { href: "/", label: "Photographers" },
  { href: "/editors", label: "Editors" },
  { href: "/job-board", label: "Job board" },
  { href: "/guides/clients", label: "Client guide" },
];

const creatorLinks = [
  { href: "/list", label: "List free (alpha)" },
  { href: "/studio", label: "Portfolio" },
  { href: "/inbox", label: "Inbox" },
  { href: "/tools", label: "Business kit" },
  { href: "/guides/creators", label: "Creator guide" },
  { href: "/list#join", label: "Register interest" },
];

const legalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/[0.05]">
      <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="max-w-sm space-y-3">
          <Logo size="lg" />
          <p className="text-sm leading-relaxed text-white/40">
            Mumbai directory for photographers, videographers, and editors.
            0% commission. List free in alpha.
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
            Unlimited briefs · 0% cut · ₹299/mo
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Legal
          </p>
          <ul className="space-y-2 text-sm">
            {legalLinks.map((item) => (
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
      </div>

      <div className="border-t border-border/70">
        <div className="page-shell flex flex-col gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} ROLLR · Mumbai</span>
          <span>Alpha · See Terms for platform role &amp; liability</span>
        </div>
      </div>
    </footer>
  );
}
