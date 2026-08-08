"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import type { PortfolioItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type PortfolioLightboxProps = {
  items: PortfolioItem[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  creatorName: string;
};

export function PortfolioLightbox({
  items,
  index,
  open,
  onClose,
  onIndexChange,
  creatorName,
}: PortfolioLightboxProps) {
  const item = items[index];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % items.length);
      if (e.key === "ArrowLeft")
        onIndexChange((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, items.length, onClose, onIndexChange]);

  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/92 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio viewer"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-zinc-200">
        <div className="min-w-0">
          <p className="truncate font-medium text-white">
            {item.title || `${creatorName} · work`}
          </p>
          <p className="text-xs text-zinc-400">
            {index + 1} / {items.length}
            {item.category ? ` · ${item.category}` : ""}
            {item.role !== "both" ? ` · ${item.role}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {item.video_url && (
            <a
              href={item.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open video
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 pb-6">
        <button
          type="button"
          className="absolute left-2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-4"
          aria-label="Previous"
          onClick={() =>
            onIndexChange((index - 1 + items.length) % items.length)
          }
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          className={cn(
            "relative h-full w-full max-w-5xl",
            "flex items-center justify-center"
          )}
        >
          <div className="relative aspect-[4/5] w-full max-h-[75vh] sm:aspect-video">
            <Image
              src={item.url}
              alt={item.title || `Work by ${creatorName}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>
        </div>

        <button
          type="button"
          className="absolute right-2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-4"
          aria-label="Next"
          onClick={() => onIndexChange((index + 1) % items.length)}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {item.caption && (
        <p className="px-4 pb-4 text-center text-sm text-zinc-400">
          {item.caption}
        </p>
      )}
    </div>
  );
}
