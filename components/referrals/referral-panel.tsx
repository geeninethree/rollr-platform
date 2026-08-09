"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Loader2, Users } from "lucide-react";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPriceInr } from "@/lib/format";
import {
  fetchMyReferralStats,
  REFERRAL_CASHBACK_INR,
  referralSignupUrl,
  type ReferralReward,
} from "@/lib/referrals";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Flip to true when referral cashback goes live */
const REFERRALS_ACTIVE = false;

export function ReferralPanel({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [earnedCount, setEarnedCount] = useState(0);
  const [earnedTotal, setEarnedTotal] = useState(0);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }
    setLoading(true);
    const stats = await fetchMyReferralStats(supabase, userId);
    setCode(stats.code);
    setPendingCount(stats.pendingCount);
    setEarnedCount(stats.earnedCount);
    setEarnedTotal(stats.earnedTotalInr);
    setRewards(stats.rewards);
    if (stats.error) {
      setError(
        stats.error.includes("referral") || stats.error.includes("schema")
          ? `${stats.error} — run migration 00005_referrals.sql`
          : stats.error
      );
    } else {
      setError(null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setOrigin(window.location.origin);
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card className="border-border bg-card/80">
        <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading referral…
        </CardContent>
      </Card>
    );
  }

  const inviteUrl = code && origin ? referralSignupUrl(origin, code) : "";

  return (
    <Card className="border-border bg-card/80 opacity-95">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-col gap-2 text-base sm:flex-row sm:items-center">
          <span className="flex items-center gap-2">
            <Gift className="h-4 w-4 shrink-0 text-muted-foreground" />
            Refer creators
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
            (NOT CURRENTLY ACTIVE — ALPHA TESTING PHASE)
          </span>
        </CardTitle>
        <div className="rounded-md border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
          Not currently active — alpha testing phase
        </div>
        <p className="text-xs text-muted-foreground">
          Planned: share your invite link; when someone signs up and{" "}
          <strong className="text-foreground">publishes</strong> a listing, you
          earn ₹{REFERRAL_CASHBACK_INR} cashback. Tracking may work in Portfolio;
          cashback is <strong className="text-foreground">not paid out</strong>{" "}
          during alpha.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {error}
          </p>
        )}

        {code && inviteUrl && (
          <div className={`space-y-2 ${!REFERRALS_ACTIVE ? "opacity-50" : ""}`}>
            <p className="text-xs font-medium text-muted-foreground">
              Your invite code (preview only):{" "}
              <span className="font-mono text-sm font-semibold text-muted-foreground">
                {code}
              </span>
            </p>
            <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
              <p className="break-all font-mono text-[11px] text-muted-foreground">
                {inviteUrl}
              </p>
            </div>
            {REFERRALS_ACTIVE ? (
              <CopyLinkButton
                url={inviteUrl}
                label="Copy invite link"
                shareTitle="Join ROLLR"
                shareText={`List on ROLLR as a Mumbai creator — use my invite.`}
              />
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Invite sharing disabled until referrals go live.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-center opacity-60">
          <div className="rounded-lg border border-border bg-background/40 p-2">
            <p className="text-lg font-semibold tabular-nums">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-2">
            <p className="text-lg font-semibold tabular-nums">{earnedCount}</p>
            <p className="text-[10px] text-muted-foreground">Onboarded</p>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-2">
            <p className="text-lg font-semibold tabular-nums">
              {formatPriceInr(earnedTotal)}
            </p>
            <p className="text-[10px] text-muted-foreground">Earned*</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          *Display only during alpha — not redeemable yet.
        </p>

        {rewards.length > 0 && (
          <div className="space-y-1.5 opacity-60">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Activity (test data)
            </p>
            <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
              {rewards.map((r) => (
                <li
                  key={r.id}
                  className="flex justify-between gap-2 rounded-md border border-border/60 px-2 py-1.5"
                >
                  <span className="text-muted-foreground">
                    {r.status === "earned" || r.status === "paid"
                      ? "Published"
                      : "Signed up"}
                  </span>
                  <span className="text-muted-foreground">
                    {r.status === "earned" || r.status === "paid"
                      ? `+₹${r.amount_inr}`
                      : "Pending publish"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
