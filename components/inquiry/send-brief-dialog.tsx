"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BookmarkCheck, FileText, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { briefTypeLabel, hasService, isHybrid } from "@/lib/format";
import {
  clearSavedClientBrief,
  getSavedClientBrief,
  hasSavedClientBrief,
  saveClientBrief,
} from "@/lib/client-brief";
import { createInquiryRemote } from "@/lib/inquiries";
import { LOCATIONS, SHOOT_CATEGORIES, EDIT_SPECIALTIES } from "@/lib/mock-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BriefType, CreatorCardModel } from "@/lib/types";
import { cn } from "@/lib/utils";

type SendBriefDialogProps = {
  creator: CreatorCardModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBriefType?: BriefType;
  presetEventDate?: string;
  surface?: "shoot" | "edit";
};

function allowedBriefTypes(creator: CreatorCardModel): BriefType[] {
  const types: BriefType[] = [];
  if (hasService(creator, "shoot")) types.push("shoot");
  if (hasService(creator, "edit")) types.push("edit");
  if (isHybrid(creator)) types.push("full_package");
  return types;
}

function defaultType(
  creator: CreatorCardModel,
  preferred?: BriefType,
  surface?: "shoot" | "edit"
): BriefType {
  const allowed = allowedBriefTypes(creator);
  if (preferred && allowed.includes(preferred)) return preferred;
  if (surface === "edit" && allowed.includes("edit")) return "edit";
  if (surface === "shoot" && allowed.includes("shoot")) return "shoot";
  return allowed[0] ?? "shoot";
}

export function SendBriefDialog({
  creator,
  open,
  onOpenChange,
  defaultBriefType,
  presetEventDate,
  surface,
}: SendBriefDialogProps) {
  const allowed = useMemo(() => allowedBriefTypes(creator), [creator]);
  const [mounted, setMounted] = useState(false);

  const [briefType, setBriefType] = useState<BriefType>(
    defaultType(creator, defaultBriefType, surface)
  );
  const [clientName, setClientName] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [eventDate, setEventDate] = useState(presetEventDate ?? "");
  const [location, setLocation] = useState(creator.sub_regions[0] ?? "Mumbai");
  const [category, setCategory] = useState(
    surface === "edit"
      ? (creator.edit_specialties?.[0] ?? creator.categories[0] ?? "Wedding")
      : (creator.categories[0] ?? "Wedding")
  );
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [saveForNext, setSaveForNext] = useState(true);
  const [usingSaved, setUsingSaved] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    setBriefType(defaultType(creator, defaultBriefType, surface));
    setSubmittedId(null);
    setError("");

    const saved = getSavedClientBrief();
    if (saved && (saved.client_name || saved.client_whatsapp)) {
      setClientName(saved.client_name);
      setClientWhatsapp(saved.client_whatsapp);
      setClientEmail(saved.client_email);
      setBudget(saved.budget);
      setMessage(saved.message);
      setEventDate(presetEventDate || saved.event_date || "");
      setLocation(
        saved.location || creator.sub_regions[0] || "Mumbai"
      );
      setSaveForNext(true);
      setUsingSaved(true);
    } else {
      setClientName("");
      setClientWhatsapp("");
      setClientEmail("");
      setBudget("");
      setMessage("");
      setEventDate(presetEventDate ?? "");
      setLocation(creator.sub_regions[0] ?? "Mumbai");
      setSaveForNext(true);
      setUsingSaved(false);
    }

    setCategory(
      surface === "edit"
        ? (creator.edit_specialties?.[0] ?? creator.categories[0] ?? "Wedding")
        : (creator.categories[0] ?? "Wedding")
    );
  }, [open, creator, defaultBriefType, presetEventDate, surface]);

  if (!open || !mounted) return null;

  const categoryOptions =
    briefType === "edit"
      ? Array.from(
          new Set([...(creator.edit_specialties ?? []), ...EDIT_SPECIALTIES])
        )
      : Array.from(new Set([...creator.categories, ...SHOOT_CATEGORIES]));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!clientName.trim() || !clientWhatsapp.trim() || !message.trim()) {
      setError("Name, WhatsApp, and a short brief are required.");
      return;
    }
    const digits = clientWhatsapp.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Enter a valid WhatsApp number (10+ digits).");
      return;
    }

    if (saveForNext) {
      saveClientBrief({
        client_name: clientName,
        client_whatsapp: clientWhatsapp,
        client_email: clientEmail,
        location,
        budget,
        message,
        event_date: eventDate,
      });
      setUsingSaved(true);
    }

    const supabase = getSupabaseBrowserClient();
    let clientUserId: string | null = null;
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      clientUserId = data.user?.id ?? null;
    }

    const result = await createInquiryRemote(
      supabase,
      {
        creator_id: creator.id,
        creator_name: creator.full_name,
        client_name: clientName,
        client_whatsapp: clientWhatsapp,
        client_email: clientEmail,
        brief_type: briefType,
        event_date: eventDate,
        location,
        category,
        budget,
        message,
      },
      clientUserId
    );

    if (!result.inquiry) {
      setError(result.error || "Could not send brief.");
      return;
    }
    // Local-only fallback: still allow success but warn clearly
    if (result.source === "local") {
      setError(
        result.error
          ? `Brief saved only on this browser (${result.error}). Creator will not see it on other devices until Supabase inquiries work.`
          : "Brief saved only on this browser — creator will not see it elsewhere."
      );
    }
    setSubmittedId(result.inquiry.id);

    // Email creator (Resend if configured) — fire and forget
    if (result.source === "supabase") {
      void fetch("/api/notify/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_id: creator.id,
          creator_name: creator.full_name,
          client_name: clientName.trim(),
          category,
          location,
          event_date: eventDate,
          message: message.trim(),
        }),
      }).catch(() => undefined);
    }
  }

  const firstName = creator.full_name.split(" ")[0] || "they";

  function clearSaved() {
    clearSavedClientBrief();
    setUsingSaved(false);
    setClientName("");
    setClientWhatsapp("");
    setClientEmail("");
    setBudget("");
    setMessage("");
    setEventDate(presetEventDate ?? "");
    setSaveForNext(true);
  }

  const dialog = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-brief-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 flex max-h-[min(92vh,100dvh)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Hire on ROLLR
            </p>
            <h2
              id="send-brief-title"
              className="mt-1 text-lg font-semibold tracking-tight"
            >
              {submittedId
                ? "Brief sent"
                : `Send brief to ${creator.full_name}`}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {submittedId
                ? `If ${firstName} can take it, they'll WhatsApp you on the number you shared. You negotiate and pay them directly — 0% to ROLLR.`
                : "Share what you need and your WhatsApp. They only message you if they accept — no spam, no public phone list."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submittedId ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">
                  Waiting for {creator.full_name} to reply
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Watch WhatsApp</strong> —
                  that&apos;s where they&apos;ll message you if they take the
                  job.
                </p>
                <p className="text-xs text-muted-foreground">
                  They&apos;ll also see this in their ROLLR Inbox (and get an
                  email if we have Resend set up). No need for you to chase
                  their public number.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Ref{" "}
                  <span className="font-mono">{submittedId}</span>
                  {saveForNext || usingSaved
                    ? " · Your details were saved for the next brief."
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="font-semibold"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
              <Button asChild variant="outline">
                <a href="/">Browse more creators</a>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            {usingSaved && hasSavedClientBrief() && (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/50 px-3 py-2.5 text-xs">
                <div className="flex gap-2 text-muted-foreground">
                  <BookmarkCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p>
                    <span className="font-medium text-foreground">
                      Using your saved brief
                    </span>
                    . Edit any field below — changes can be saved again on submit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearSaved}
                  className="shrink-0 font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Brief type
              </p>
              <div className="flex flex-wrap gap-2">
                {allowed.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBriefType(t)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      briefType === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {briefTypeLabel(t)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="client-name"
                >
                  Your name
                </label>
                <Input
                  id="client-name"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Full name"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="client-wa"
                >
                  Your WhatsApp
                </label>
                <Input
                  id="client-wa"
                  required
                  value={clientWhatsapp}
                  onChange={(e) => setClientWhatsapp(e.target.value)}
                  placeholder="+91 98xxx xxxxx"
                  className="bg-background/50"
                />
                <p className="text-[10px] text-muted-foreground">
                  Shared with the creator only after they accept.
                </p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="client-email"
                >
                  Email (optional)
                </label>
                <Input
                  id="client-email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="event-date"
                >
                  Event / delivery date
                </label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="location"
                >
                  Location
                </label>
                <select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                  <option value="Remote">Remote</option>
                  <option value="Mumbai">Mumbai (other)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="category"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="budget"
                >
                  Budget (optional)
                </label>
                <Input
                  id="budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. ₹15k–20k"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="message"
                >
                  Brief
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hours, deliverables, venue, links to refs…"
                  className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={saveForNext}
                onChange={(e) => setSaveForNext(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              />
              <span>
                <span className="font-medium text-foreground">
                  Save my details for next time
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Stores name, WhatsApp, email, location, budget, and brief text
                  on this device only — autofills the next Send brief.
                </span>
              </span>
            </label>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-[11px] text-muted-foreground">
              <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
              No public phone numbers. WhatsApp opens for the creator only after
              accept.
            </div>

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                type="submit"
                className="h-11 w-full font-semibold sm:h-9 sm:w-auto"
              >
                Send brief
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full sm:h-9 sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Badge
                variant="secondary"
                className="self-start text-[10px] sm:ml-auto sm:self-center"
              >
                {briefTypeLabel(briefType)}
              </Badge>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
