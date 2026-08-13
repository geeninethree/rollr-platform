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
    <div className="border-b border-white/[0.04] bg-black">
      <div className="page-shell flex items-center gap-3 py-1.5 text-[11px] sm:text-xs">
        <p className="min-w-0 flex-1 text-muted-foreground">
          <span className="font-medium text-foreground/90">Alpha</span>
          <span className="mx-1.5 text-border">·</span>
          List free in alpha · ₹299/mo when billing starts · 0% commission
          <span className="hidden sm:inline">
            {" · "}
            <Link
              href="/guides/creators"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Creator guide
            </Link>
          </span>
        </p>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground pressable"
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
