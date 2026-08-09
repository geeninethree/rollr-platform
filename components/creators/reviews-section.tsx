"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import type { Review } from "@/lib/reviews";
import { fetchPublishedReviews, fetchSuccessStories } from "@/lib/reviews";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ReviewsSection({
  creatorId,
  rating,
  reviewCount,
}: {
  creatorId: string;
  rating: number;
  reviewCount: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stories, setStories] = useState<Review[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void (async () => {
      const [r, s] = await Promise.all([
        fetchPublishedReviews(supabase, creatorId),
        fetchSuccessStories(supabase, creatorId),
      ]);
      setReviews(r);
      setStories(s);
    })();
  }, [creatorId]);

  if (reviewCount === 0 && reviews.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Reviews</h2>
        <p className="text-sm text-muted-foreground">
          No reviews yet. After a job from a ROLLR brief, clients can rate this
          creator — that&apos;s how trust stays on-platform even when chat moves
          to WhatsApp.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Reviews</h2>
        {rating > 0 && (
          <p className="inline-flex items-center gap-1 text-sm tabular-nums">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="font-semibold">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({reviewCount} review{reviewCount === 1 ? "" : "s"})
            </span>
          </p>
        )}
      </div>

      {stories.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Success stories
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {stories.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm"
              >
                <p className="leading-relaxed text-foreground">
                  “{s.success_quote || s.body || "Great experience on ROLLR."}”
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  — {s.client_name}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="space-y-3">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-border bg-card/60 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      "h-3.5 w-3.5",
                      n <= r.rating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/40"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-medium">{r.client_name}</span>
            </div>
            {r.body && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {r.body}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
