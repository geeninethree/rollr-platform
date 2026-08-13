"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IndianRupee, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchPublicRateCardForCreator,
  formatRateMoney,
  publicRateCardPath,
  type RateCard,
} from "@/lib/rate-cards";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfileRateCardProps = {
  creatorUserId: string;
  creatorName: string;
};

/** Shows the creator’s public rate card packages on their profile. */
export function ProfileRateCard({
  creatorUserId,
  creatorName,
}: ProfileRateCardProps) {
  const [card, setCard] = useState<RateCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !creatorUserId) {
        setLoading(false);
        return;
      }
      const result = await fetchPublicRateCardForCreator(
        supabase,
        creatorUserId
      );
      if (cancelled) return;
      setCard(result.card || null);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [creatorUserId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-white/35">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading packages…
      </div>
    );
  }

  if (!card || card.packages.length === 0) return null;

  const publicPath = publicRateCardPath(card.public_token);

  return (
    <section className="surface-panel space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-primary">
            Packages
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            {card.title || "Rate card"}
          </h2>
          {card.creator_tagline && (
            <p className="mt-1 text-sm text-white/40">{card.creator_tagline}</p>
          )}
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={publicPath}>
            <IndianRupee className="h-3.5 w-3.5" />
            Full rate card
          </Link>
        </Button>
      </div>

      <ul className="divide-y divide-white/[0.06]">
        {card.packages.slice(0, 6).map((pkg, i) => (
          <li
            key={i}
            className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/90">{pkg.name}</p>
              {pkg.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-white/40">
                  {pkg.description}
                </p>
              )}
              {pkg.unit && (
                <p className="mt-1 text-[10px] uppercase tracking-wide text-white/30">
                  {pkg.unit}
                </p>
              )}
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums text-primary">
              {pkg.price > 0
                ? `From ${formatRateMoney(pkg.price)}`
                : "On request"}
            </p>
          </li>
        ))}
      </ul>

      {card.packages.length > 6 && (
        <p className="text-xs text-white/35">
          +{card.packages.length - 6} more on full rate card
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-white/30">
        Indicative packages from {creatorName}. Final quote after brief · pay
        creator directly · 0% to ROLLR.
      </p>
    </section>
  );
}
