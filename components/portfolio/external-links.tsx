import { ExternalLink, Link2, PlayCircle, Share2 } from "lucide-react";
import { hasExternalLinks, linkLabel } from "@/lib/portfolio";
import type { ExternalLinks as Links } from "@/lib/types";

type ExternalLinksProps = {
  links: Links;
};

export function ExternalLinksSection({ links }: ExternalLinksProps) {
  if (!hasExternalLinks(links)) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Also online
        </h2>
        <p className="text-sm text-muted-foreground">
          No external portfolio links added yet.
        </p>
      </section>
    );
  }

  const rows: {
    key: string;
    label: string;
    url: string;
    icon: typeof Link2;
  }[] = [];

  if (links.portfolio_url) {
    rows.push({
      key: "portfolio",
      label: "Portfolio",
      url: links.portfolio_url,
      icon: Link2,
    });
  }
  if (links.instagram_url) {
    rows.push({
      key: "ig",
      label: "Instagram",
      url: links.instagram_url,
      icon: Share2,
    });
  }
  if (links.showreel_url) {
    rows.push({
      key: "reel",
      label: "Showreel",
      url: links.showreel_url,
      icon: PlayCircle,
    });
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Also online
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          External links — full proof of work lives in Selected work above
        </p>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.key}>
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-card/60 px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-card"
            >
              <row.icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{row.label}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {linkLabel(row.url)}
                </span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
