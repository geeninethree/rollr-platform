"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Health = {
  ok: boolean;
  configured: boolean;
  urlHost?: string;
  message?: string;
  hint?: string;
};

const steps = [
  {
    n: 1,
    title: "Create a Supabase project",
    body: "supabase.com → New project → pick a password and region (Mumbai if available: ap-south-1).",
    href: "https://supabase.com/dashboard",
  },
  {
    n: 2,
    title: "Run SQL migrations",
    body: "SQL Editor → paste and run 00001_init.sql, then 00002_rls_and_profile_trigger.sql from the repo.",
  },
  {
    n: 3,
    title: "Copy API keys",
    body: "Project Settings → API → Project URL + anon public key into .env.local",
  },
  {
    n: 4,
    title: "Restart dev server",
    body: "Stop and run npm.cmd run dev so Next.js picks up env vars.",
  },
  {
    n: 5,
    title: "Verify connection",
    body: "Use the Test connection button on this page.",
  },
];

export default function SupabaseSetupPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(false);

  const test = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supabase/health", { cache: "no-store" });
      const data = (await res.json()) as Health;
      setHealth(data);
    } catch (e) {
      setHealth({
        ok: false,
        configured: false,
        message: e instanceof Error ? e.message : "Request failed",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void test();
  }, [test]);

  return (
    <div className="bg-grid-fade">
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <p className="text-overline text-primary">Setup</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Connect Supabase
          </h1>
          <p className="text-sm text-muted-foreground">
            The app still uses mock data for the directory until we wire live
            queries. This page only checks project + schema connectivity.
          </p>
        </div>

        <Card
          className={
            health?.ok
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-border bg-card"
          }
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {health?.ok ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              Connection status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {loading && !health ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking…
              </p>
            ) : (
              <>
                <p className="text-foreground">{health?.message}</p>
                {health?.urlHost && (
                  <p className="text-xs text-muted-foreground">
                    Host: {health.urlHost}
                  </p>
                )}
                {health?.hint && (
                  <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    {health.hint}
                  </p>
                )}
              </>
            )}
            <Button
              type="button"
              size="sm"
              className="font-semibold"
              onClick={() => void test()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Testing…
                </>
              ) : (
                "Test connection"
              )}
            </Button>
          </CardContent>
        </Card>

        <ol className="space-y-4">
          {steps.map((s) => (
            <li
              key={s.n}
              className="flex gap-3 rounded-xl border border-border bg-card/60 p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
                {s.n}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.body}</p>
                {s.href && (
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Open dashboard <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="rounded-xl border border-border bg-card/40 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Files in this repo</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <code className="text-primary">supabase/migrations/00001_init.sql</code>{" "}
              — tables &amp; enums
            </li>
            <li>
              <code className="text-primary">
                supabase/migrations/00002_rls_and_profile_trigger.sql
              </code>{" "}
              — RLS + auto profile on signup
            </li>
            <li>
              <code className="text-primary">
                supabase/migrations/00003_creator_listing_fields.sql
              </code>{" "}
              — studio fields (tagline, works, links, listing_status)
            </li>
            <li>
              <code className="text-primary">
                supabase/migrations/00004_category_prices.sql
              </code>{" "}
              — package prices by category
            </li>
            <li>
              <code className="text-primary">
                supabase/migrations/00005_referrals.sql
              </code>{" "}
              — referral codes + ₹50 cashback tracking
            </li>
            <li>
              <code className="text-primary">
                supabase/migrations/00006_storage_avatars_covers.sql
              </code>{" "}
              — avatar &amp; cover image uploads
            </li>
            <li>
              <code className="text-primary">
                supabase/migrations/00007_waitlist_and_inquiries.sql
              </code>{" "}
              — waitlist store + client briefs (inbox / WhatsApp)
            </li>
            <li>
              <code className="text-primary">
                supabase/migrations/00008_admin_reviews_portfolio.sql
              </code>{" "}
              — admin RLS, listing approve, reviews, portfolio uploads
            </li>
            <li>
              <code className="text-primary">.env.local</code> — keys +{" "}
              <code className="text-primary">NEXT_PUBLIC_ADMIN_EMAILS</code> for{" "}
              <Link href="/admin" className="text-primary underline">
                /admin
              </Link>
            </li>
          </ul>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href="/">← Back to directory</Link>
        </Button>
      </div>
    </div>
  );
}
