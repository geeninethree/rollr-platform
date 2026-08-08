"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PortfolioLightbox } from "@/components/portfolio/portfolio-lightbox";
import { worksForMode } from "@/lib/portfolio";
import type { PortfolioItem, ServiceMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type PortfolioGalleryProps = {
  works: PortfolioItem[];
  mode: ServiceMode;
  creatorName: string;
};

type Filter = "all" | "featured" | "shoot" | "edit";

export function PortfolioGallery({
  works,
  mode,
  creatorName,
}: PortfolioGalleryProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const modeWorks = useMemo(() => worksForMode(works, mode), [works, mode]);

  const filtered = useMemo(() => {
    let list = modeWorks;
    if (filter === "featured") list = list.filter((w) => w.is_featured);
    if (filter === "shoot")
      list = list.filter((w) => w.role === "shoot" || w.role === "both");
    if (filter === "edit")
      list = list.filter((w) => w.role === "edit" || w.role === "both");
    return list;
  }, [modeWorks, filter]);

  if (modeWorks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No portfolio pieces for this tab yet.
      </div>
    );
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "featured", label: "Featured" },
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Selected work
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {modeWorks.length} pieces on ROLLR · click to enlarge
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                filter === f.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {filtered.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setIndex(modeWorks.findIndex((w) => w.id === item.id));
              setOpen(true);
            }}
            className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-secondary text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Image
              src={item.url}
              alt={item.title || `${creatorName} work ${i + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-8">
              <div className="flex flex-wrap gap-1">
                {item.is_featured && (
                  <Badge className="h-5 bg-primary/90 px-1.5 text-[9px] text-primary-foreground hover:bg-primary/90">
                    Featured
                  </Badge>
                )}
                {item.media_type === "video" && (
                  <Badge
                    variant="secondary"
                    className="h-5 gap-0.5 bg-black/50 px-1.5 text-[9px] text-white"
                  >
                    <Play className="h-2.5 w-2.5" /> Video
                  </Badge>
                )}
              </div>
              {item.title && (
                <p className="mt-1 truncate text-[11px] font-medium text-white">
                  {item.title}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      <PortfolioLightbox
        items={modeWorks}
        index={Math.max(0, index)}
        open={open}
        onClose={() => setOpen(false)}
        onIndexChange={setIndex}
        creatorName={creatorName}
      />
    </section>
  );
}
