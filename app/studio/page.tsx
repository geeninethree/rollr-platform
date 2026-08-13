"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Cloud,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListingStatusBadge } from "@/components/portfolio/listing-status-badge";
import { QualityChecklist } from "@/components/portfolio/quality-checklist";
import { ReferralPanel } from "@/components/referrals/referral-panel";
import { ProfileShareCard } from "@/components/share/profile-share-card";
import { ImageUploadField } from "@/components/studio/image-upload-field";
import { StudioStepper } from "@/components/studio/studio-stepper";
import {
  loadCreatorListing,
  saveCreatorListing,
} from "@/lib/creator-listing";
import { LOCATIONS, SHOOT_CATEGORIES } from "@/lib/mock-data";
import {
  formatFromPrice,
  getPriceGuide,
  minPackagePrice,
  newPricingPackage,
  packagesToRateCardPackages,
  syncCategoryPrices,
  type PackageMode,
  type PricingPackage,
} from "@/lib/pricing";
import { createRateCard } from "@/lib/rate-cards";
import { uploadCreatorImage, uploadSizeHint } from "@/lib/storage";
import {
  STUDIO_STEPS,
  firstIncompleteStep,
  isStepComplete,
  stepIndex,
  validateStudioStep,
  type StudioStepId,
} from "@/lib/studio-steps";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  draftToCreator,
  emptyStudioDraft,
  PREVIEW_AVATAR,
  PREVIEW_COVER,
  withSyncedPricing,
  type StudioDraft,
} from "@/lib/studio";
import type { PortfolioItem, ServiceMode } from "@/lib/types";
import {
  connectionErrorMessage,
  humanizeSaveError,
} from "@/lib/user-messages";
import { cn } from "@/lib/utils";

const PRESET_WORKS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80",
];

const STORAGE_STEP_KEY = "rollr_studio_step";

export default function StudioPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<StudioDraft>(emptyStudioDraft);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [step, setStep] = useState<StudioStepId>("about");
  const [userId, setUserId] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [workUrl, setWorkUrl] = useState(PRESET_WORKS[0]);
  const [workRole, setWorkRole] = useState<"shoot" | "edit" | "both">("shoot");
  const [uploadingWorks, setUploadingWorks] = useState(false);
  const [uploadWorkError, setUploadWorkError] = useState<string | null>(null);
  const [publishingRateCard, setPublishingRateCard] = useState(false);
  const [rateCardMsg, setRateCardMsg] = useState<string | null>(null);
  const workFileRef = useRef<HTMLInputElement>(null);
  const stepTopRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(connectionErrorMessage());
      setLoading(false);
      setMounted(true);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/studio")}`);
      return;
    }

    setUserId(user.id);
    const result = await loadCreatorListing(supabase, user.id);
    if (result.error) {
      setError(humanizeSaveError(result.error));
    }
    setDraft(result.draft);
    setListingId(result.listingId);

    // Resume last step, or jump to first incomplete
    try {
      const saved = sessionStorage.getItem(STORAGE_STEP_KEY) as StudioStepId | null;
      if (saved && STUDIO_STEPS.some((s) => s.id === saved)) {
        setStep(saved);
      } else {
        setStep(firstIncompleteStep(result.draft));
      }
    } catch {
      setStep(firstIncompleteStep(result.draft));
    }

    setLoading(false);
    setMounted(true);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_STEP_KEY, step);
    } catch {
      /* ignore */
    }
  }, [step]);

  const creator = useMemo(() => draftToCreator(draft), [draft]);
  const currentMeta = STUDIO_STEPS.find((s) => s.id === step)!;
  const currentIdx = stepIndex(step);
  const isLast = currentIdx === STUDIO_STEPS.length - 1;
  const isFirst = currentIdx === 0;

  const completedCount = useMemo(
    () =>
      STUDIO_STEPS.filter(
        (s) => s.id !== "review" && isStepComplete(s.id, draft)
      ).length,
    [draft]
  );
  const requiredSteps = STUDIO_STEPS.length - 1; // review is optional completeness

  function updateLocal(partial: Partial<StudioDraft>) {
    setDraft((d) => ({ ...d, ...partial, updated_at: new Date().toISOString() }));
    setStatusMsg(null);
    setStepErrors([]);
  }

  function goToStep(id: StudioStepId) {
    setStepErrors([]);
    setStep(id);
    setStatusMsg(null);
    requestAnimationFrame(() => {
      stepTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function tryNext() {
    const errs = validateStudioStep(step, draft);
    if (errs.length > 0) {
      setStepErrors(errs);
      return;
    }
    setStepErrors([]);
    if (!isLast) {
      goToStep(STUDIO_STEPS[currentIdx + 1].id);
    }
  }

  function goBack() {
    if (!isFirst) {
      goToStep(STUDIO_STEPS[currentIdx - 1].id);
    }
  }

  function jumpToFirstIssue() {
    const id = firstIncompleteStep(draft);
    goToStep(id);
    const errs = validateStudioStep(id, draft);
    setStepErrors(errs);
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
    setStepErrors([]);
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
    setStepErrors([]);
  }

  function toggleCategory(cat: string) {
    setDraft((d) => {
      const categories = d.categories.includes(cat)
        ? d.categories.filter((c) => c !== cat)
        : [...d.categories, cat];
      const nextCats = categories.length ? categories : [cat];
      // Keep packages as-is; only touch category list (filters)
      const category_prices = syncCategoryPrices(
        nextCats,
        d.category_prices || {},
        "shoot"
      );
      const synced = withSyncedPricing({
        ...d,
        categories: nextCats,
        category_prices,
      });
      return {
        ...d,
        categories: nextCats,
        ...synced,
        updated_at: new Date().toISOString(),
      };
    });
    setStepErrors([]);
  }

  function updatePackage(id: string, patch: Partial<PricingPackage>) {
    setDraft((d) => {
      const pricing_packages = (d.pricing_packages || []).map((p) =>
        p.id === id ? { ...p, ...patch } : p
      );
      const synced = withSyncedPricing({ ...d, pricing_packages });
      return {
        ...d,
        ...synced,
        updated_at: new Date().toISOString(),
      };
    });
    setStepErrors([]);
  }

  function defaultPackageMode(d: StudioDraft): PackageMode {
    const shoot = d.service_modes.includes("shoot");
    const edit = d.service_modes.includes("edit");
    if (edit && !shoot) return "edit";
    if (shoot && edit) return "shoot";
    return "shoot";
  }

  function addPackage(seed?: Partial<PricingPackage>) {
    setDraft((d) => {
      const mode = seed?.mode || defaultPackageMode(d);
      const guideMode = mode === "edit" ? "edit" : "shoot";
      const guide = seed?.category
        ? getPriceGuide(seed.category, guideMode)
        : getPriceGuide(mode === "edit" ? "Reels / vertical" : "Custom", guideMode);
      const pricing_packages = [
        ...(d.pricing_packages || []),
        newPricingPackage({
          name: seed?.name || (mode === "edit" ? "Edit package" : "New package"),
          description: seed?.description || "",
          price: seed?.price ?? guide.suggested,
          unit: seed?.unit || guide.unit,
          category: seed?.category,
          mode,
        }),
      ];
      const synced = withSyncedPricing({ ...d, pricing_packages });
      return {
        ...d,
        ...synced,
        updated_at: new Date().toISOString(),
      };
    });
    setStepErrors([]);
  }

  function removePackage(id: string) {
    setDraft((d) => {
      const pricing_packages = (d.pricing_packages || []).filter(
        (p) => p.id !== id
      );
      const synced = withSyncedPricing({ ...d, pricing_packages });
      return {
        ...d,
        ...synced,
        updated_at: new Date().toISOString(),
      };
    });
    setStepErrors([]);
  }

  function addPackageForCategory(cat: string) {
    const guide = getPriceGuide(cat, "shoot");
    addPackage({
      name: `${cat} package`,
      price: guide.suggested,
      unit: guide.unit,
      category: cat,
      mode: "shoot",
    });
  }

  function addEditPackagePreset(label: string) {
    const guide = getPriceGuide(label, "edit");
    addPackage({
      name: label,
      price: guide.suggested,
      unit: guide.unit,
      mode: "edit",
    });
  }

  async function publishPackagesAsRateCard() {
    if (!userId || publishingRateCard) return;
    const named = (draft.pricing_packages || []).filter((p) => p.name.trim());
    if (named.length === 0) {
      setRateCardMsg("Add named packages first.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setPublishingRateCard(true);
    setRateCardMsg(null);
    // Save listing first so packages persist
    const saved = await saveCreatorListing(supabase, userId, draft);
    if (!saved.ok) {
      setPublishingRateCard(false);
      setRateCardMsg(saved.error || "Couldn’t save listing.");
      return;
    }
    if (saved.draft) setDraft(saved.draft);
    const result = await createRateCard(supabase, userId, {
      title: "Rate card",
      creator_name: draft.full_name || "Creator",
      creator_tagline: draft.tagline || undefined,
      packages: packagesToRateCardPackages(named),
      notes:
        draft.pricing_notes?.trim() ||
        "Prices indicative. Final quote after brief. Pay creator directly.",
      status: "active",
    });
    setPublishingRateCard(false);
    if (result.error || !result.card) {
      setRateCardMsg(result.error || "Couldn’t create rate card.");
      return;
    }
    setRateCardMsg("Rate card published — open to share.");
    router.push(`/rate-cards/${result.card.id}`);
  }

  /** Parse price field without sticky leading zeros. */
  function onPackagePriceChange(id: string, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      updatePackage(id, { price: 0 });
      return;
    }
    const normalized = digits.replace(/^0+/, "") || "0";
    updatePackage(id, { price: Number(normalized) });
  }

  function packagePriceDisplay(price: number): string {
    if (!price || price <= 0) return "";
    return String(price);
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

  async function uploadWorks(files: FileList | null) {
    if (!files?.length || !userId) return;
    setUploadWorkError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setUploadWorkError(connectionErrorMessage());
      return;
    }
    setUploadingWorks(true);
    const all = Array.from(files);
    const truncated = all.length > 12;
    const batch = all.slice(0, 12);
    const next: PortfolioItem[] = [...draft.works];
    let featuredCount = next.filter((w) => w.is_featured).length;
    let ok = 0;
    let lastErr: string | null = null;
    for (const file of batch) {
      const result = await uploadCreatorImage(supabase, userId, file, "work");
      if (result.error || !result.url) {
        lastErr = result.error || "Upload failed";
        continue;
      }
      ok += 1;
      next.push({
        id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url: result.url,
        media_type: "image",
        role: workRole,
        is_featured: featuredCount < 3,
        sort_order: next.length,
        title: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Work",
        category: draft.categories[0],
      });
      if (featuredCount < 3) featuredCount += 1;
    }
    updateLocal({ works: next });
    setUploadingWorks(false);

    if (ok === 0) {
      setUploadWorkError(lastErr || "Couldn’t upload images. Try smaller JPGs.");
      return;
    }
    if (lastErr) {
      setUploadWorkError(
        `Uploaded ${ok} of ${batch.length}. ${lastErr}${
          truncated ? " (only first 12 files taken)" : ""
        }`
      );
      return;
    }
    setUploadWorkError(null);
    if (truncated) {
      setStatusMsg("Uploaded 12 images (max per batch). Add more if you need.");
    }
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
      setError(connectionErrorMessage());
      return;
    }

    if (opts?.submitForReview) {
      const incomplete = firstIncompleteStep(draft);
      if (incomplete !== "review") {
        goToStep(incomplete);
        setStepErrors(validateStudioStep(incomplete, draft));
        setError(
          "Finish the highlighted step before submitting for review."
        );
        return;
      }
    }

    setSaving(true);
    setError(null);
    setStatusMsg(null);

    const result = await saveCreatorListing(supabase, userId, draft, opts);
    setSaving(false);

    if (!result.ok) {
      setError(humanizeSaveError(result.error || "Save failed"));
      return;
    }

    if (result.draft) setDraft(result.draft);
    if (result.listingId) setListingId(result.listingId);
    setStatusMsg(
      opts?.submitForReview
        ? result.draft?.listing_status === "published"
          ? "Listing updated and still live."
          : result.draft?.listing_status === "pending_review"
            ? "Submitted for review. You’ll go live after ROLLR approves your portfolio."
            : "Saved as draft — finish remaining steps, then submit again."
        : "Listing saved."
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
      <div className="page-shell min-w-0 space-y-8 pb-20 pt-8 sm:pt-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/35">
              Portfolio
            </p>
            <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-white sm:text-3xl">
              Build your listing
            </h1>
            <p className="max-w-xl text-sm text-white/40">
              Step {currentMeta.number} of {STUDIO_STEPS.length} ·{" "}
              {completedCount}/{requiredSteps} complete
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ListingStatusBadge status={draft.listing_status} />
            <Button asChild variant="outline" size="sm">
              <Link href="/list">Pricing</Link>
            </Button>
          </div>
        </div>

        <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-[var(--ease-out-expo)]"
            style={{
              width: `${Math.round((completedCount / requiredSteps) * 100)}%`,
            }}
          />
        </div>

        {/* Stepper */}
        <div ref={stepTopRef} className="scroll-mt-20">
          <StudioStepper current={step} draft={draft} onSelect={goToStep} />
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

        <div className="grid min-w-0 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Active step */}
          <div className="min-w-0 space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/35">
                  Step {currentMeta.number}
                </p>
                <CardTitle className="text-lg text-white">
                  {currentMeta.title}
                </CardTitle>
                <p className="text-sm text-white/40">
                  {currentMeta.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ── Step content ─────────────────────────── */}
                {step === "about" && (
                  <div className="grid gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">
                        Name / studio
                      </label>
                      <Input
                        value={draft.full_name}
                        onChange={(e) =>
                          updateLocal({ full_name: e.target.value })
                        }
                        placeholder="Your name / studio"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">
                        Tagline
                      </label>
                      <Input
                        value={draft.tagline}
                        onChange={(e) =>
                          updateLocal({ tagline: e.target.value })
                        }
                        placeholder="e.g. Wedding films · Bandra"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-muted-foreground">
                          Bio
                        </label>
                        <span
                          className={cn(
                            "text-[11px] tabular-nums",
                            draft.bio.trim().length >= 40
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          {draft.bio.trim().length}/40 min
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={draft.bio}
                        onChange={(e) => updateLocal({ bio: e.target.value })}
                        placeholder="Tell clients what you shoot/edit (40+ characters)"
                        className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                {step === "photos" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {userId ? (
                      <>
                        <ImageUploadField
                          label="Profile photo"
                          kind="avatar"
                          userId={userId}
                          value={draft.avatar_url}
                          onChange={(url) => updateLocal({ avatar_url: url })}
                          aspectClass="aspect-square"
                        />
                        <ImageUploadField
                          label="Cover image"
                          kind="cover"
                          userId={userId}
                          value={draft.cover_url}
                          onChange={(url) => updateLocal({ cover_url: url })}
                          aspectClass="aspect-[16/10]"
                        />
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground sm:col-span-2">
                        Sign in to upload photos.
                      </p>
                    )}
                  </div>
                )}

                {step === "services" && (
                  <div className="space-y-5">
                    <div>
                      <p className="mb-2 text-xs text-muted-foreground">
                        I offer
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(["shoot", "edit"] as ServiceMode[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => toggleMode(m)}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-medium",
                              draft.service_modes.includes(m)
                                ? "border-primary/50 bg-primary text-primary-foreground"
                                : "border-white/10 bg-transparent text-white/50"
                            )}
                          >
                            {m === "shoot"
                              ? "Photographer / video"
                              : "Editor / post"}
                          </button>
                        ))}
                      </div>
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
                                : "bg-white/[0.06] text-white/50"
                            )}
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs text-muted-foreground">
                        Categories
                      </p>
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
                                : "bg-white/[0.06] text-white/50"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === "pricing" && (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">
                        Add{" "}
                        <strong className="text-foreground">
                          named packages
                        </strong>{" "}
                        — full day, half day, reels, custom offers — not just
                        one number per category. Clients see package list +{" "}
                        <strong className="text-foreground">From ₹…</strong> on
                        your card.
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Categories (Services step) are for{" "}
                        <em>filters</em>. Packages are what you actually sell.
                      </p>
                    </div>

                    {(draft.pricing_packages || []).length === 0 && (
                      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                        No packages yet. Add a custom one or quick-add from a
                        category below.
                      </p>
                    )}

                    <ul className="space-y-3">
                      {(draft.pricing_packages || []).map((pkg, idx) => (
                        <li
                          key={pkg.id}
                          className="space-y-3 rounded-xl border border-border bg-background/40 p-3 sm:p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              Package {idx + 1}
                            </p>
                            <button
                              type="button"
                              onClick={() => removePackage(pkg.id)}
                              className="rounded-md p-1 text-muted-foreground hover:bg-white/[0.06] hover:text-destructive"
                              aria-label="Remove package"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-[1fr_110px]">
                            <div className="space-y-1">
                              <label className="text-[11px] text-muted-foreground">
                                Name
                              </label>
                              <Input
                                value={pkg.name}
                                onChange={(e) =>
                                  updatePackage(pkg.id, {
                                    name: e.target.value,
                                  })
                                }
                                placeholder="e.g. Wedding full day · 2 cams"
                                className="bg-background/50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] text-muted-foreground">
                                Price ₹
                              </label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="On request"
                                value={packagePriceDisplay(pkg.price)}
                                onChange={(e) =>
                                  onPackagePriceChange(pkg.id, e.target.value)
                                }
                                className="bg-background/50 tabular-nums"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] text-muted-foreground">
                              What’s included (optional)
                            </label>
                            <textarea
                              rows={2}
                              value={pkg.description || ""}
                              onChange={(e) =>
                                updatePackage(pkg.id, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Hours, deliverables, team size…"
                              className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div className="space-y-1">
                              <label className="text-[11px] text-muted-foreground">
                                Type
                              </label>
                              <select
                                value={pkg.mode || "shoot"}
                                onChange={(e) =>
                                  updatePackage(pkg.id, {
                                    mode: e.target.value as PackageMode,
                                  })
                                }
                                className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 text-sm"
                              >
                                <option value="shoot">Shoot / coverage</option>
                                <option value="edit">Edit / post</option>
                                <option value="both">Shoot + edit</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] text-muted-foreground">
                                Unit label
                              </label>
                              <Input
                                value={pkg.unit || ""}
                                onChange={(e) =>
                                  updatePackage(pkg.id, {
                                    unit: e.target.value,
                                  })
                                }
                                placeholder="Full day · Per reel"
                                className="bg-background/50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] text-muted-foreground">
                                Category (optional)
                              </label>
                              <select
                                value={pkg.category || ""}
                                onChange={(e) =>
                                  updatePackage(pkg.id, {
                                    category: e.target.value || undefined,
                                  })
                                }
                                className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 text-sm"
                              >
                                <option value="">None / custom</option>
                                {draft.categories.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                                {SHOOT_CATEGORIES.filter(
                                  (c) => !draft.categories.includes(c)
                                ).map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addPackage()}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add package
                      </Button>
                      {draft.service_modes.includes("edit") && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            addPackage({
                              mode: "edit",
                              name: "Edit package",
                            })
                          }
                        >
                          + Edit package
                        </Button>
                      )}
                    </div>

                    {draft.categories.length > 0 &&
                      draft.service_modes.includes("shoot") && (
                        <div className="space-y-2">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Quick-add shoot packages
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {draft.categories.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => addPackageForCategory(cat)}
                                className="rounded-full border border-border bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/60 hover:border-primary/40 hover:text-primary"
                              >
                                + {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    {draft.service_modes.includes("edit") && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Quick-add edit packages
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Wedding film",
                            "Reels / vertical",
                            "Colour grade",
                            "Same-day teaser",
                          ].map((label) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => addEditPackagePreset(label)}
                              className="rounded-full border border-border bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/60 hover:border-primary/40 hover:text-primary"
                            >
                              + {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 border-t border-border pt-4">
                      <label className="text-xs font-medium text-muted-foreground">
                        Pricing notes (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={draft.pricing_notes || ""}
                        onChange={(e) =>
                          updateLocal({ pricing_notes: e.target.value })
                        }
                        placeholder="e.g. 30% deposit · Travel outside Mumbai extra · Final quote after brief"
                        className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Shown on your public profile under packages.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={
                          publishingRateCard ||
                          (draft.pricing_packages || []).filter((p) =>
                            p.name.trim()
                          ).length === 0
                        }
                        onClick={() => void publishPackagesAsRateCard()}
                      >
                        {publishingRateCard ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Publish as public rate card
                      </Button>
                      <p className="text-[11px] text-muted-foreground">
                        Shareable link for Insta / clients (saves listing first).
                      </p>
                    </div>
                    {rateCardMsg && (
                      <p className="text-xs text-primary">{rateCardMsg}</p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Directory card shows{" "}
                      <span className="font-medium text-foreground">
                        {formatFromPrice(
                          minPackagePrice(draft.pricing_packages) ||
                            draft.starting_price
                        )}
                      </span>{" "}
                      (lowest package with a price). Leave ₹ blank for “on
                      request” packages.
                    </p>
                  </div>
                )}

                {step === "portfolio" && (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Min 3 pieces · feature your best 3.{" "}
                      {uploadSizeHint("work")} · up to 12 at once.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <select
                        value={workRole}
                        onChange={(e) =>
                          setWorkRole(e.target.value as typeof workRole)
                        }
                        className="h-9 w-full rounded-md border border-input bg-background/50 px-2 text-sm sm:w-auto"
                      >
                        <option value="shoot">Shoot</option>
                        <option value="edit">Edit</option>
                        <option value="both">Both</option>
                      </select>
                      <input
                        ref={workFileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          void uploadWorks(e.target.files);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        className="w-full font-semibold sm:w-auto"
                        disabled={uploadingWorks || !userId}
                        onClick={() => workFileRef.current?.click()}
                      >
                        {uploadingWorks ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {uploadingWorks ? "Uploading…" : "Upload images"}
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={workUrl}
                        onChange={(e) => setWorkUrl(e.target.value)}
                        placeholder="Or paste https://… image URL"
                        className="min-w-0 bg-background/50"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        onClick={addWork}
                      >
                        Add URL
                      </Button>
                    </div>
                    {uploadWorkError && (
                      <p
                        className={cn(
                          "text-xs leading-snug",
                          uploadWorkError.toLowerCase().includes("uploaded")
                            ? "text-foreground"
                            : "text-destructive"
                        )}
                      >
                        {uploadWorkError}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_WORKS.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setWorkUrl(u)}
                          className="relative h-12 w-12 overflow-hidden rounded-md border border-border"
                        >
                          <Image
                            src={u}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </button>
                      ))}
                    </div>
                    <ul className="space-y-2">
                      {draft.works.length === 0 && (
                        <li className="text-sm text-muted-foreground">
                          No pieces yet — add at least 3.
                        </li>
                      )}
                      {draft.works.map((w) => (
                        <li
                          key={w.id}
                          className="flex flex-col gap-2 rounded-lg border border-border p-2 sm:flex-row sm:items-center sm:gap-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-secondary">
                              <Image
                                src={w.url}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="48px"
                                unoptimized={w.url.includes("supabase.co")}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">
                                {w.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {w.role}
                                {w.is_featured ? " · featured" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-xs"
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
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-muted-foreground">
                      Featured:{" "}
                      {draft.works.filter((w) => w.is_featured).length}/3
                      required
                    </p>
                  </div>
                )}

                {step === "review" && (
                  <div className="space-y-5">
                    <div className="grid gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">
                          Portfolio URL{" "}
                          <span className="text-muted-foreground/70">
                            (optional)
                          </span>
                        </label>
                        <Input
                          value={draft.links.portfolio_url ?? ""}
                          onChange={(e) =>
                            updateLocal({
                              links: {
                                ...draft.links,
                                portfolio_url: e.target.value,
                              },
                            })
                          }
                          placeholder="https://yoursite.com"
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">
                          Instagram URL{" "}
                          <span className="text-muted-foreground/70">
                            (optional)
                          </span>
                        </label>
                        <Input
                          value={draft.links.instagram_url ?? ""}
                          onChange={(e) =>
                            updateLocal({
                              links: {
                                ...draft.links,
                                instagram_url: e.target.value,
                              },
                            })
                          }
                          placeholder="https://instagram.com/you"
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">
                          Showreel URL{" "}
                          <span className="text-muted-foreground/70">
                            (optional)
                          </span>
                        </label>
                        <Input
                          value={draft.links.showreel_url ?? ""}
                          onChange={(e) =>
                            updateLocal({
                              links: {
                                ...draft.links,
                                showreel_url: e.target.value,
                              },
                            })
                          }
                          placeholder="https://youtube.com/…"
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    {/* Summary of remaining issues */}
                    <div className="rounded-xl border border-border bg-background/40 p-4">
                      <p className="text-sm font-semibold">Before you submit</p>
                      <ul className="mt-3 space-y-2">
                        {STUDIO_STEPS.filter((s) => s.id !== "review").map(
                          (s) => {
                            const ok = isStepComplete(s.id, draft);
                            return (
                              <li key={s.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!ok) {
                                      goToStep(s.id);
                                      setStepErrors(
                                        validateStudioStep(s.id, draft)
                                      );
                                    } else {
                                      goToStep(s.id);
                                    }
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-secondary/60"
                                >
                                  {ok ? (
                                    <Check className="h-4 w-4 shrink-0 text-primary" />
                                  ) : (
                                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-destructive/50 text-[10px] text-destructive">
                                      !
                                    </span>
                                  )}
                                  <span
                                    className={
                                      ok
                                        ? "text-muted-foreground"
                                        : "font-medium text-destructive"
                                    }
                                  >
                                    {s.title}
                                    {!ok && " — needs attention"}
                                  </span>
                                </button>
                              </li>
                            );
                          }
                        )}
                      </ul>
                      {completedCount < requiredSteps && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={jumpToFirstIssue}
                        >
                          Jump to next issue
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step validation errors */}
                {stepErrors.length > 0 && (
                  <div
                    className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5"
                    role="alert"
                  >
                    <p className="text-xs font-semibold text-destructive">
                      Fix these to continue
                    </p>
                    <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-destructive">
                      {stepErrors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nav */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={isFirst}
                onClick={goBack}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full sm:w-auto"
                  disabled={saving}
                  onClick={() => void persist()}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Cloud className="h-4 w-4" />
                  )}
                  Save draft
                </Button>
                {!isLast ? (
                  <Button
                    type="button"
                    className="w-full font-semibold sm:w-auto"
                    onClick={tryNext}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="w-full font-semibold sm:w-auto"
                    disabled={saving}
                    onClick={() => void persist({ submitForReview: true })}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Submit for review
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
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

            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-secondary">
                  <Image
                    src={draft.cover_url || PREVIEW_COVER}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="400px"
                    unoptimized={(draft.cover_url || "").includes(
                      "supabase.co"
                    )}
                  />
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary">
                    <Image
                      src={draft.avatar_url || PREVIEW_AVATAR}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized={(draft.avatar_url || "").includes(
                        "supabase.co"
                      )}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {draft.full_name || "Your name"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {draft.tagline || "Your tagline"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">{draft.works.length} works</Badge>
                  <Badge variant="outline">
                    Step {currentMeta.number}/{STUDIO_STEPS.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {userId && <ReferralPanel userId={userId} />}

            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              Save anytime. Submit when all required steps are green — ROLLR
              approves before you appear in the directory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
