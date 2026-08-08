"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListingStatusBadge } from "@/components/portfolio/listing-status-badge";
import { QualityChecklist } from "@/components/portfolio/quality-checklist";
import { LOCATIONS, SHOOT_CATEGORIES } from "@/lib/mock-data";
import {
  draftToCreator,
  emptyStudioDraft,
  loadStudioDraft,
  saveStudioDraft,
  submitDraftForReview,
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
  const [draft, setDraft] = useState<StudioDraft>(emptyStudioDraft);
  const [mounted, setMounted] = useState(false);
  const [workUrl, setWorkUrl] = useState(PRESET_WORKS[0]);
  const [workRole, setWorkRole] = useState<"shoot" | "edit" | "both">("shoot");

  useEffect(() => {
    setDraft(loadStudioDraft());
    setMounted(true);
  }, []);

  const creator = useMemo(() => draftToCreator(draft), [draft]);

  function update(partial: Partial<StudioDraft>) {
    setDraft((d) => {
      const next = { ...d, ...partial };
      return saveStudioDraft(next);
    });
  }

  function toggleMode(mode: ServiceMode) {
    setDraft((d) => {
      const has = d.service_modes.includes(mode);
      let service_modes = has
        ? d.service_modes.filter((m) => m !== mode)
        : [...d.service_modes, mode];
      if (service_modes.length === 0) service_modes = ["shoot"];
      return saveStudioDraft({ ...d, service_modes });
    });
  }

  function toggleRegion(loc: string) {
    setDraft((d) => {
      const sub_regions = d.sub_regions.includes(loc)
        ? d.sub_regions.filter((r) => r !== loc)
        : [...d.sub_regions, loc];
      return saveStudioDraft({
        ...d,
        sub_regions: sub_regions.length ? sub_regions : [loc],
      });
    });
  }

  function toggleCategory(cat: string) {
    setDraft((d) => {
      const categories = d.categories.includes(cat)
        ? d.categories.filter((c) => c !== cat)
        : [...d.categories, cat];
      return saveStudioDraft({
        ...d,
        categories: categories.length ? categories : [cat],
      });
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
    update({ works: [...draft.works, item] });
  }

  function removeWork(id: string) {
    update({ works: draft.works.filter((w) => w.id !== id) });
  }

  function toggleFeatured(id: string) {
    update({
      works: draft.works.map((w) =>
        w.id === id ? { ...w, is_featured: !w.is_featured } : w
      ),
    });
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">
        Loading studio…
      </div>
    );
  }

  return (
    <div className="bg-grid-fade">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Creator studio · local demo
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Build your listing
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Draft a profile with portfolio pieces and external links. Quality
              checks mirror real publish rules. Saved in this browser only —
              not Supabase yet.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ListingStatusBadge status={draft.listing_status} />
            <Button asChild variant="outline" size="sm">
              <Link href="/list">₹299 plan</Link>
            </Button>
          </div>
        </div>

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
                    onChange={(e) => update({ full_name: e.target.value })}
                    placeholder="Your name / studio"
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs text-muted-foreground">Tagline</label>
                  <Input
                    value={draft.tagline}
                    onChange={(e) => update({ tagline: e.target.value })}
                    placeholder="e.g. Wedding films · Bandra"
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs text-muted-foreground">Bio</label>
                  <textarea
                    rows={3}
                    value={draft.bio}
                    onChange={(e) => update({ bio: e.target.value })}
                    placeholder="Tell clients what you shoot/edit (40+ chars for publish)"
                    className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Avatar image URL
                  </label>
                  <Input
                    value={draft.avatar_url}
                    onChange={(e) => update({ avatar_url: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Cover image URL
                  </label>
                  <Input
                    value={draft.cover_url}
                    onChange={(e) => update({ cover_url: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
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
                  Portfolio on ROLLR
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Min 3 pieces required. Featured pieces power directory cards.
                  Paste image URLs (demo — no file upload without Supabase).
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
                      No pieces yet — add at least 3 to pass review.
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
                <p className="text-xs text-muted-foreground">
                  Portfolio site, Instagram, showreel — optional but improves
                  trust. Never enough alone to publish.
                </p>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Portfolio URL
                  </label>
                  <Input
                    value={draft.links.portfolio_url ?? ""}
                    onChange={(e) =>
                      update({
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
                      update({
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
                      update({
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

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-secondary">
                  <Image
                    src={creator.cover_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <Image
                      src={creator.avatar_url || ""}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{creator.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {creator.tagline}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">{draft.works.length} works</Badge>
                  {creator.links.portfolio_url && (
                    <Badge variant="outline">Has portfolio link</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full font-semibold"
                onClick={() => setDraft(submitDraftForReview(draft))}
              >
                Submit for review
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Demo only: sets status to Pending review if checks pass. Live
                admin queue needs Supabase later.
              </p>
              {draft.listing_status === "pending_review" && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-200">
                  Submitted — in a real app a reviewer would approve before
                  Discover.
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => setDraft(saveStudioDraft(emptyStudioDraft()))}
              >
                Reset draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
