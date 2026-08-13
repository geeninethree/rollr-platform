"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  computeMoneyTotals,
  createQuote,
  draftQuoteFromInquiry,
  draftQuoteFromPackages,
  fetchMyQuotes,
  formatQuoteMoney,
  type CreateQuoteInput,
  type Quote,
} from "@/lib/quotes";
import type { MoneyLineItem } from "@/lib/doc-money";
import { fetchMyInquiries } from "@/lib/inquiries";
import { normalizePackages, type PricingPackage } from "@/lib/pricing";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Inquiry } from "@/lib/types";

export default function QuotesPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading quotes…
        </div>
      }
    >
      <QuotesInner />
    </Suspense>
  );
}

function QuotesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillInquiry = searchParams.get("inquiry");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [accepted, setAccepted] = useState<Inquiry[]>([]);
  const [listingPackages, setListingPackages] = useState<PricingPackage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateQuoteInput>({
    seller_name: "",
    seller_email: "",
    seller_phone: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    line_items: [{ description: "Creative services", quantity: 1, unit_amount: 0 }],
    gst_percent: 0,
    notes: "",
  });

  const totals = useMemo(
    () => computeMoneyTotals(form.line_items, form.gst_percent || 0),
    [form.line_items, form.gst_percent]
  );

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Couldn’t connect.");
      setLoading(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login?next=/quotes");
      return;
    }
    setUserId(user.id);
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .maybeSingle();
    setForm((f) => ({
      ...f,
      seller_name: f.seller_name || profile?.full_name || user.email?.split("@")[0] || "",
      seller_email: f.seller_email || profile?.email || user.email || "",
      seller_phone: f.seller_phone || profile?.phone || "",
    }));
    const q = await fetchMyQuotes(supabase, user.id);
    if (q.error) setError(q.error);
    setQuotes(q.quotes);
    const briefs = await fetchMyInquiries(supabase, user.id);
    setAccepted(
      briefs.items.filter(
        (i) => i.status === "accepted" || i.status === "pending"
      )
    );
    const { data: listing } = await supabase
      .from("creator_profiles")
      .select("pricing_packages")
      .eq("profile_id", user.id)
      .maybeSingle();
    setListingPackages(normalizePackages(listing?.pricing_packages));
    if (prefillInquiry) {
      const match = briefs.items.find((i) => i.id === prefillInquiry);
      if (match) {
        setForm((f) => ({
          ...f,
          ...draftQuoteFromInquiry(match, {
            name: profile?.full_name || user.email?.split("@")[0] || "Creator",
            email: profile?.email || user.email || undefined,
            phone: profile?.phone || undefined,
          }),
        }));
        setShowForm(true);
      }
    }
    setLoading(false);
  }, [router, prefillInquiry]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateLine(i: number, patch: Partial<MoneyLineItem>) {
    setForm((f) => ({
      ...f,
      line_items: f.line_items.map((li, idx) =>
        idx === i ? { ...li, ...patch } : li
      ),
    }));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || saving) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const result = await createQuote(supabase, userId, form);
    setSaving(false);
    if (result.error || !result.quote) {
      setError(result.error || "Couldn’t create quote.");
      return;
    }
    router.push(`/quotes/${result.quote.id}`);
  }

  if (loading) {
    return (
      <div className="page-shell flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading quotes…
      </div>
    );
  }

  return (
    <div className="bg-grid-fade">
      <div className="page-shell max-w-3xl space-y-8 py-8 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-primary">
              Creator tools
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Quotes
            </h1>
            <p className="max-w-lg text-sm text-white/45">
              Send an estimate before the job. Convert to invoice when ready.
            </p>
          </div>
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            {showForm ? "Hide" : "New quote"}
          </Button>
        </div>

        {error && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </p>
        )}

        {listingPackages.filter((p) => p.name.trim() && p.price > 0).length >
          0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-white">
                From your packages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-white/40">
                Prefill a quote with packages from your portfolio pricing.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setForm((f) => ({
                    ...f,
                    ...draftQuoteFromPackages(listingPackages, {
                      name: f.seller_name,
                      email: f.seller_email,
                      phone: f.seller_phone,
                    }),
                    client_name: f.client_name,
                  }));
                  setShowForm(true);
                }}
              >
                Use all priced packages
              </Button>
              <ul className="space-y-1.5 pt-1">
                {listingPackages
                  .filter((p) => p.name.trim() && p.price > 0)
                  .map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({
                          ...f,
                          ...draftQuoteFromPackages([pkg], {
                            name: f.seller_name,
                            email: f.seller_email,
                            phone: f.seller_phone,
                          }),
                          client_name: f.client_name,
                        }));
                        setShowForm(true);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-3 py-2 text-left text-sm hover:border-primary/30"
                    >
                      <span className="font-medium text-white/90">
                        {pkg.name}
                      </span>
                      <span className="text-xs text-primary">
                        {formatQuoteMoney(pkg.price)} →
                      </span>
                    </button>
                  ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {accepted.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-white">From briefs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {accepted.slice(0, 6).map((inq) => (
                <button
                  key={inq.id}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      ...draftQuoteFromInquiry(inq, {
                        name: f.seller_name,
                        email: f.seller_email,
                        phone: f.seller_phone,
                      }),
                    }));
                    setShowForm(true);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5 text-left text-sm hover:border-primary/30"
                >
                  <span>
                    <span className="font-medium text-white/90">{inq.client_name}</span>
                    <span className="mt-0.5 block text-xs text-white/40">
                      {inq.category} · {inq.location}
                    </span>
                  </span>
                  <span className="text-xs text-primary">Prefill →</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-white">Create quote</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    required
                    placeholder="Your name"
                    value={form.seller_name}
                    onChange={(e) => setForm((f) => ({ ...f, seller_name: e.target.value }))}
                    className="bg-background/50"
                  />
                  <Input
                    required
                    placeholder="Client name"
                    value={form.client_name}
                    onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                    className="bg-background/50"
                  />
                  <Input
                    placeholder="Client phone"
                    value={form.client_phone || ""}
                    onChange={(e) => setForm((f) => ({ ...f, client_phone: e.target.value }))}
                    className="bg-background/50"
                  />
                  <Input
                    type="date"
                    placeholder="Valid until"
                    value={form.valid_until || ""}
                    onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                    className="bg-background/50"
                  />
                </div>
                {form.line_items.map((li, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_70px_110px]">
                    <Input
                      required
                      placeholder="Description"
                      value={li.description}
                      onChange={(e) => updateLine(i, { description: e.target.value })}
                      className="bg-background/50"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={li.quantity || ""}
                      onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })}
                      className="bg-background/50"
                    />
                    <Input
                      type="number"
                      min={0}
                      placeholder="₹"
                      value={li.unit_amount || ""}
                      onChange={(e) => updateLine(i, { unit_amount: Number(e.target.value) || 0 })}
                      className="bg-background/50"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs text-primary"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      line_items: [
                        ...f.line_items,
                        { description: "", quantity: 1, unit_amount: 0 },
                      ],
                    }))
                  }
                >
                  + Add line
                </button>
                <div className="flex justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                  <span className="text-white/50">Total</span>
                  <span className="font-semibold text-primary tabular-nums">
                    {formatQuoteMoney(totals.total)}
                  </span>
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Create quote
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/35">
            Your quotes
          </h2>
          {quotes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/40">
              No quotes yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {quotes.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/quotes/${q.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-4 py-3 hover:border-primary/30"
                  >
                    <div>
                      <p className="font-medium text-white/90">{q.client_name}</p>
                      <p className="text-xs text-white/40">
                        {q.quote_number} · {q.issue_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {q.status}
                      </Badge>
                      <span className="font-semibold tabular-nums text-primary">
                        {formatQuoteMoney(q.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-xs text-white/30">
          <Link href="/tools" className="text-primary/80 hover:underline">
            ← All tools
          </Link>
        </p>
      </div>
    </div>
  );
}
