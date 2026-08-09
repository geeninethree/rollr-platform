"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchInquiryByReviewToken,
  submitReview,
} from "@/lib/reviews";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ReviewTokenPage() {
  const params = useParams();
  const token = String(params?.token || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const [clientName, setClientName] = useState("");
  const [already, setAlready] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [successStory, setSuccessStory] = useState(false);
  const [quote, setQuote] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("Service unavailable");
        setLoading(false);
        return;
      }
      const result = await fetchInquiryByReviewToken(supabase, token);
      if (result.error || !result.inquiry) {
        setError(result.error || "Invalid link");
        setLoading(false);
        return;
      }
      setCreatorName(result.inquiry.creator_name);
      setClientName(result.inquiry.client_name);
      setAlready(Boolean(result.alreadyReviewed));
      setLoading(false);
    }
    if (token) void load();
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const result = await submitReview(supabase, {
      token,
      rating,
      body,
      is_success_story: successStory,
      success_quote: successStory ? quote || body : undefined,
      client_name: clientName,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error || "Could not save review");
      return;
    }
    setDone(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="bg-grid-fade">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <Card className="border-border bg-card/90">
          <CardHeader>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              ROLLR review
            </p>
            <CardTitle className="text-xl">
              {done
                ? "Thank you"
                : already
                  ? "Already reviewed"
                  : `How was your experience with ${creatorName}?`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {done || already ? (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Your feedback helps Mumbai clients pick the right creator —
                  and helps {creatorName} build trust on ROLLR.
                </p>
                <Button asChild variant="outline">
                  <Link href="/">Browse directory</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Rating
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className="p-1"
                        aria-label={`${n} stars`}
                      >
                        <Star
                          className={cn(
                            "h-7 w-7",
                            n <= rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Your name
                  </label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Review (optional)
                  </label>
                  <textarea
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="What went well? Timeliness, quality, communication…"
                    className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                  />
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={successStory}
                    onChange={(e) => setSuccessStory(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Feature as a <strong>success story</strong> on their profile
                    (short quote OK)
                  </span>
                </label>
                {successStory && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Short quote for their profile
                    </label>
                    <Input
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      placeholder="e.g. Made our Bandra wedding look cinematic"
                      className="bg-background/50"
                    />
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full font-semibold"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Submit review"}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  Reviews are for jobs arranged via ROLLR briefs. See{" "}
                  <Link href="/terms" className="text-primary">
                    Terms
                  </Link>
                  .
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
