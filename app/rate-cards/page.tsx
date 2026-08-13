"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IndianRupee, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createRateCard,
  fetchMyRateCards,
  formatRateMoney,
  type CreateRateCardInput,
  type RateCard,
  type RatePackage,
} from "@/lib/rate-cards";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RateCardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [cards, setCards] = useState<RateCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateRateCardInput>({
    title: "Rate card",
    creator_name: "",
    creator_tagline: "Photographer / editor · Mumbai",
    packages: [
      { name: "Wedding package", description: "Full day coverage", price: 25000, unit: "Starting" },
      { name: "Edit / post", description: "Colour + selects", price: 8000, unit: "From" },
    ],
    notes: "Prices indicative. Final quote after brief. Travel outside Mumbai billed separately.",
  });

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
      router.replace("/login?next=/rate-cards");
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
      creator_name: f.creator_name || profile?.full_name || user.email?.split("@")[0] || "",
      creator_email: f.creator_email || profile?.email || user.email || "",
      creator_phone: f.creator_phone || profile?.phone || "",
    }));
    const r = await fetchMyRateCards(supabase, user.id);
    if (r.error) setError(r.error);
    setCards(r.cards);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  function updatePkg(i: number, patch: Partial<RatePackage>) {
    setForm((f) => ({
      ...f,
      packages: f.packages.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || saving) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const result = await createRateCard(supabase, userId, form);
    setSaving(false);
    if (result.error || !result.card) {
      setError(result.error || "Couldn’t create rate card.");
      return;
    }
    router.push(`/rate-cards/${result.card.id}`);
  }

  if (loading) {
    return (
      <div className="page-shell flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
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
              Rate cards
            </h1>
            <p className="max-w-lg text-sm text-white/45">
              Share a public package sheet with clients and on socials.
            </p>
          </div>
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            {showForm ? "Hide" : "New rate card"}
          </Button>
        </div>

        {error && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </p>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-white">Create rate card</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void onCreate(e)} className="space-y-3">
                <Input
                  required
                  placeholder="Your name"
                  value={form.creator_name}
                  onChange={(e) => setForm((f) => ({ ...f, creator_name: e.target.value }))}
                  className="bg-background/50"
                />
                <Input
                  placeholder="Tagline"
                  value={form.creator_tagline || ""}
                  onChange={(e) => setForm((f) => ({ ...f, creator_tagline: e.target.value }))}
                  className="bg-background/50"
                />
                {form.packages.map((p, i) => (
                  <div key={i} className="grid gap-2 rounded-xl border border-white/[0.06] p-3 sm:grid-cols-[1fr_1fr_100px]">
                    <Input
                      required
                      placeholder="Package name"
                      value={p.name}
                      onChange={(e) => updatePkg(i, { name: e.target.value })}
                      className="bg-background/50"
                    />
                    <Input
                      placeholder="Description"
                      value={p.description}
                      onChange={(e) => updatePkg(i, { description: e.target.value })}
                      className="bg-background/50"
                    />
                    <Input
                      type="number"
                      min={0}
                      placeholder="₹ from"
                      value={p.price || ""}
                      onChange={(e) => updatePkg(i, { price: Number(e.target.value) || 0 })}
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
                      packages: [
                        ...f.packages,
                        { name: "", description: "", price: 0, unit: "From" },
                      ],
                    }))
                  }
                >
                  + Add package
                </button>
                <Button type="submit" className="w-full font-semibold" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
                  Publish rate card
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {cards.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/40">
              No rate cards yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {cards.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/rate-cards/${c.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-4 py-3 hover:border-primary/30"
                  >
                    <div>
                      <p className="font-medium text-white/90">{c.title}</p>
                      <p className="text-xs text-white/40">
                        {c.packages.length} packages · from{" "}
                        {formatRateMoney(
                          (() => {
                            const prices = c.packages
                              .map((p) => p.price)
                              .filter((n) => n > 0);
                            return prices.length ? Math.min(...prices) : 0;
                          })()
                        )}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {c.status}
                    </Badge>
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
