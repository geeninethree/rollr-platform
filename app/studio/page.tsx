"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cloud, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListingStatusBadge } from "@/components/portfolio/listing-status-badge";
import { QualityChecklist } from "@/components/portfolio/quality-checklist";
import { ReferralPanel } from "@/components/referrals/referral-panel";
import { ProfileShareCard } from "@/components/share/profile-share-card";
import { ImageUploadField } from "@/components/studio/image-upload-field";
import {
  loadCreatorListing,
  saveCreatorListing,
} from "@/lib/creator-listing";
import { LOCATIONS, SHOOT_CATEGORIES } from "@/lib/mock-data";
import {
  formatFromPrice,
  getPriceGuide,
  minCategoryPrice,
  syncCategoryPrices,
} from "@/lib/pricing";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  draftToCreator,
  emptyStudioDraft,
  type StudioDraft,
} from "@/lib/studio";
import type { PortfolioItem, ServiceMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRESET_WORKS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80",
];

export default function StudioPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<StudioDraft>(emptyStudioDraft);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [workUrl, setWorkUrl] = useState(PRESET_WORKS[0]);
  const [workRole, setWorkRole] = useState<"shoot" | "edit" | "both">("shoot");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      setMounted(true);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace(
        `/login?next=${encodeURIComponent("/studio")}`
      );
      return;
    }

    setUserId(user.id);
    const result = await loadCreatorListing(supabase, user.id);
    if (result.error) {
      setError(
        result.error.includes("column") || result.error.includes("schema")
          ? `${result.error} — run migrations 00003–00005 in the Supabase SQL Editor.`
          : result.error
      );
    }
    setDraft(result.draft);
    setListingId(result.listingId);
    setLoading(false);
    setMounted(true);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const creator = useMemo(() => draftToCreator(draft), [draft]);

  function updateLocal(partial: Partial<StudioDraft>) {
    setDraft((d) => ({ ...d, ...partial, updated_at: new Date().toISOString() }));
    setStatusMsg(null);
  }

  function toggleMode(mode: ServiceMode) {
    setDraft((d) => {
      const has = d.service_modes.includes(mode);
      let service_modes = has
        ? d.service_modes.filter((m) => m !== mode)
        : [...d.service_modes, mode];
      if (service_modes.length === 0) service_modes = ["shoot"];
      return { ...d, service_modes, updated_at: new Date().toISOString() };
    });
  }

  function toggleRegion(loc: string) {
    setDraft((d) => {
      const sub_regions = d.sub_regions.includes(loc)
        ? d.sub_regions.filter((r) => r !== loc)
        : [...d.sub_regions, loc];
      return {
        ...d,
        sub_regions: sub_regions.length ? sub_regions : [loc],
        updated_at: new Date().toISOString(),
      };
    });
  }

  function toggleCategory(cat: string) {
    setDraft((d) => {
      const categories = d.categories.includes(cat)
        ? d.categories.filter((c) => c !== cat)
        : [...d.categories, cat];
      const nextCats = categories.length ? categories : [cat];
      const category_prices = syncCategoryPrices(
        nextCats,
        d.category_prices || {},
        "shoot"
      );
      return {
        ...d,
        categories: nextCats,
        category_prices,
        starting_price: minCategoryPrice(category_prices),
        updated_at: new Date().toISOString(),
      };
    });
  }

  function setCategoryPrice(cat: string, value: number) {
    setDraft((d) => {
      const category_prices = {
        ...d.category_prices,
        [cat]: value,
      };
      return {
        ...d,
        category_prices,
        starting_price: minCategoryPrice(category_prices),
        updated_at: new Date().toISOString(),
      };
    });
  }

  function addWork() {
    if (!workUrl.trim()) return;
    const item: PortfolioItem = {
      id: `w_${Date.now()}`,
      url: workUrl.trim(),
      media_type: "image",
      role: workRole,
      is_featured: draft.works.filter((w) => w.is_featured).length < 3,
      sort_order: draft.works.length,
      title: workRole === "edit" ? "Edit sample" : "Shoot sample",
      category: draft.categories[0],
    };
    updateLocal({ works: [...draft.works, item] });
  }

  function removeWork(id: string) {
    updateLocal({ works: draft.works.filter((w) => w.id !== id) });
  }

  function toggleFeatured(id: string) {
    updateLocal({
      works: draft.works.map((w) =>
        w.id === id ? { ...w, is_featured: !w.is_featured } : w
      ),
    });
  }

  async function persist(opts?: { submitForReview?: boolean }) {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setSaving(true);
    setError(null);
    setStatusMsg(null);

    const result = await saveCreatorListing(supabase, userId, draft, opts);
    setSaving(false);

    if (!result.ok) {
      setError(
        result.error?.includes("column")
          ? `${result.error} — run migration 00003 in Supabase SQL Editor.`
          : result.error || "Save failed"
      );
      return;
    }

    if (result.draft) setDraft(result.draft);
    if (result.listingId) setListingId(result.listingId);
    setStatusMsg(
      opts?.submitForReview
        ? result.draft?.listing_status === "published"
          ? "Listing saved and published. Share your profile link below."
          : "Saved as draft — finish required quality checks to publish."
        : "Listing saved to Supabase."
    );
  }

  if (!mounted || loading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your listing…
      </div>
    );
  }

  return (
    <div className="bg-grid-fade">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Creator portfolio
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Your portfolio
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Build and publish your ROLLR listing. Avatar and cover can be
              uploaded; portfolio stills can use image URLs for now.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ListingStatusBadge status={draft.listing_status} />
            <Button asChild variant="outline" size="sm">
              <Link href="/list">₹299 plan</Link>
            </Button>
          </div>
        </div>

        {error && (
          <p
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        {statusMsg && (
          <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
            {statusMsg}
          </p>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="border-border bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Basics</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input
                    value={draft.full_name}
                    onChange={(e) => updateLocal({ full_name: e.target.value })}
                    placeholder="Your name / studio"
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs text-muted-foreground">Tagline</label>
                  <Input
                    value={draft.tagline}
                    onChange={(e) => updateLocal({ tagline: e.target.value })}
                    placeholder="e.g. Wedding films · Bandra"
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs text-muted-foreground">Bio</label>
                  <textarea
                    rows={3}
                    value={draft.bio}
                    onChange={(e) => updateLocal({ bio: e.target.value })}
                    placeholder="Tell clients what you shoot/edit (40+ chars to publish)"
                    className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                  />
                </div>
                {userId ? (
                  <>
                    <div className="sm:col-span-1">
                      <ImageUploadField
                        label="Profile photo (avatar)"
                        kind="avatar"
                        userId={userId}
                        value={draft.avatar_url}
                        onChange={(url) => updateLocal({ avatar_url: url })}
                        aspectClass="aspect-square"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <ImageUploadField
                        label="Cover image"
                        kind="cover"
                        userId={userId}
                        value={draft.cover_url}
                        onChange={(url) => updateLocal({ cover_url: url })}
                        aspectClass="aspect-[16/10]"
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    Sign in to upload photos.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Services & areas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(["shoot", "edit"] as ServiceMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMode(m)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        draft.service_modes.includes(m)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-secondary text-muted-foreground"
                      )}
                    >
                      {m === "shoot" ? "Photographer / video" : "Editor / post"}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">Areas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => toggleRegion(loc)}
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[11px] font-medium",
                          draft.sub_regions.includes(loc)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">Categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SHOOT_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[11px] font-medium",
                          draft.categories.includes(cat)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">
                  Package prices by category
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Set a <strong className="text-foreground">starting package</strong>{" "}
                  for each category you offer — not hourly. Clients see “From ₹…”.
                  Guides are soft Mumbai ballparks; set what you actually charge.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {draft.categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Select categories above first.
                  </p>
                )}
                {draft.categories.map((cat) => {
                  const guide = getPriceGuide(cat, "shoot");
                  return (
                    <div
                      key={cat}
                      className="rounded-lg border border-border bg-background/40 p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{cat}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {guide.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            min={0}
                            step={500}
                            value={draft.category_prices[cat] ?? guide.suggested}
                            onChange={(e) =>
                              setCategoryPrice(cat, Number(e.target.value) || 0)
                            }
                            className="h-9 w-32 bg-background/50 tabular-nums"
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                        {guide.hint}
                      </p>
                    </div>
                  );
                })}
                {draft.categories.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Directory shows{" "}
                    <span className="font-medium text-foreground">
                      {formatFromPrice(minCategoryPrice(draft.category_prices))}
                    </span>{" "}
                    (your lowest package floor).
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Portfolio on ROLLR</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Min 3 pieces to publish. Image URLs for now.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={workUrl}
                    onChange={(e) => setWorkUrl(e.target.value)}
                    placeholder="https://… image URL"
                    className="bg-background/50"
                  />
                  <select
                    value={workRole}
                    onChange={(e) =>
                      setWorkRole(e.target.value as typeof workRole)
                    }
                    className="h-9 rounded-md border border-input bg-background/50 px-2 text-sm"
                  >
                    <option value="shoot">Shoot</option>
                    <option value="edit">Edit</option>
                    <option value="both">Both</option>
                  </select>
                  <Button type="button" onClick={addWork} className="font-semibold">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_WORKS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setWorkUrl(u)}
                      className="relative h-12 w-12 overflow-hidden rounded-md border border-border"
                    >
                      <Image src={u} alt="" fill className="object-cover" sizes="48px" />
                    </button>
                  ))}
                </div>
                <ul className="space-y-2">
                  {draft.works.length === 0 && (
                    <li className="text-sm text-muted-foreground">
                      No pieces yet — add at least 3 to publish.
                    </li>
                  )}
                  {draft.works.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-2"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-secondary">
                        <Image src={w.url} alt="" fill className="object-cover" sizes="48px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{w.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {w.role}
                          {w.is_featured ? " · featured" : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => toggleFeatured(w.id)}
                      >
                        {w.is_featured ? "Unfeature" : "Feature"}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeWork(w.id)}
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/80">
              <CardHeader>
                <CardTitle className="text-base">Also online (links)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Portfolio URL
                  </label>
                  <Input
                    value={draft.links.portfolio_url ?? ""}
                    onChange={(e) =>
                      updateLocal({
                        links: { ...draft.links, portfolio_url: e.target.value },
                      })
                    }
                    placeholder="https://yoursite.com"
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Instagram URL
                  </label>
                  <Input
                    value={draft.links.instagram_url ?? ""}
                    onChange={(e) =>
                      updateLocal({
                        links: { ...draft.links, instagram_url: e.target.value },
                      })
                    }
                    placeholder="https://instagram.com/you"
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Showreel URL
                  </label>
                  <Input
                    value={draft.links.showreel_url ?? ""}
                    onChange={(e) =>
                      updateLocal({
                        links: { ...draft.links, showreel_url: e.target.value },
                      })
                    }
                    placeholder="https://youtube.com/…"
                    className="bg-background/50"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <QualityChecklist
              creator={creator}
              score={creator.quality_score}
            />

            {listingId && draft.listing_status === "published" && (
              <ProfileShareCard
                listingId={listingId}
                creatorName={draft.full_name || "My ROLLR profile"}
              />
            )}

            {userId && <ReferralPanel userId={userId} />}

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-secondary">
                  {draft.cover_url && (
                    <Image
                      src={draft.cover_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="400px"
                    />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full bg-secondary">
                    {draft.avatar_url && (
                      <Image
                        src={draft.avatar_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {draft.full_name || "Your name"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {draft.tagline || "Your tagline"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">{draft.works.length} works</Badge>
                  {draft.links.portfolio_url && (
                    <Badge variant="outline">Has portfolio link</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full font-semibold"
                disabled={saving}
                onClick={() => void persist()}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4" />
                    Save to Supabase
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full font-semibold"
                disabled={saving}
                onClick={() => void persist({ submitForReview: true })}
              >
                Save &amp; publish
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Publish requires the quality checklist. Sets role to{" "}
                <strong className="text-foreground">creator</strong> on save.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
