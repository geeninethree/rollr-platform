"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const DISMISS_KEY = "rollr_demo_banner_dismissed";

export function DemoBanner() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") {
        setVisible(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="border-b border-border/60 bg-card/40">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-1.5 text-[11px] sm:px-6 sm:text-xs">
        <p className="min-w-0 flex-1 text-muted-foreground">
          <span className="font-medium text-foreground/90">Demo</span>
          <span className="mx-1.5 text-border">·</span>
          Sample data · briefs stay in this browser
          <span className="hidden sm:inline">
            {" · "}
            <Link
              href="/creators/c1"
              className="font-medium text-primary/90 underline-offset-2 hover:underline"
            >
              Sample profile
            </Link>
          </span>
        </p>
        <button
          type="button"
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground pressable"
          aria-label="Dismiss demo banner"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
            setVisible(false);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
