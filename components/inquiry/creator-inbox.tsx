"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  Inbox,
  Loader2,
  MessageCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  briefTypeLabel,
  creatorToClientWhatsAppUrl,
  formatDateIn,
} from "@/lib/format";
import {
  INQUIRIES_CHANGED,
  fetchMyInquiries,
  listInquiries,
  setInquiryStatusRemote,
} from "@/lib/inquiries";
import { markJobCompleteAndCreateReviewLink } from "@/lib/reviews";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Inquiry } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CreatorInbox() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [filter, setFilter] = useState<
    "all" | "pending" | "accepted" | "declined"
  >("all");
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"supabase" | "local">("local");
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setItems(listInquiries());
      setSource("local");
      setSignedIn(false);
      setLoading(false);
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setItems(listInquiries());
      setSource("local");
      setSignedIn(false);
      setError(null);
      setLoading(false);
      return;
    }

    setSignedIn(true);
    const result = await fetchMyInquiries(supabase, auth.user.id);
    if (result.error) {
      setError(result.error);
      // merge remote error with local so nothing is lost
      const local = listInquiries();
      const byId = new Map<string, Inquiry>();
      for (const i of [...result.items, ...local]) byId.set(i.id, i);
      setItems(
        Array.from(byId.values()).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
      setSource(result.items.length ? "supabase" : "local");
    } else {
      setError(null);
      setItems(result.items);
      setSource(result.listingIds.length ? "supabase" : "local");
      if (result.listingIds.length === 0 && result.items.length === 0) {
        setItems(listInquiries());
        setSource("local");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener(INQUIRIES_CHANGED, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(INQUIRIES_CHANGED, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const visible = items.filter((i) =>
    filter === "all" ? true : i.status === filter
  );
  const pendingCount = items.filter((i) => i.status === "pending").length;

  async function accept(inquiry: Inquiry) {
    const supabase = getSupabaseBrowserClient();
    const result = await setInquiryStatusRemote(
      supabase,
      inquiry.id,
      "accepted"
    );
    const updated = result.inquiry;
    if (!updated) {
      setError(result.error || "Could not accept brief.");
      return;
    }
    if (result.error) {
      setError(`Accepted locally; sync note: ${result.error}`);
    }
    await refresh();
    if (!updated.client_whatsapp?.trim()) {
      setError("Accepted, but client WhatsApp is missing on this brief.");
      return;
    }
    const url = creatorToClientWhatsAppUrl({
      clientWhatsapp: updated.client_whatsapp,
      clientName: updated.client_name,
      creatorName: updated.creator_name,
      briefType: updated.brief_type,
      eventDate: updated.event_date,
      location: updated.location,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function decline(id: string) {
    const supabase = getSupabaseBrowserClient();
    const result = await setInquiryStatusRemote(supabase, id, "declined");
    if (result.error && !result.inquiry) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  async function requestReview(inquiry: Inquiry) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const result = await markJobCompleteAndCreateReviewLink(
      supabase,
      inquiry.id
    );
    if (result.error || !result.url) {
      setError(result.error || "Could not create review link");
      return;
    }
    try {
      await navigator.clipboard.writeText(result.url);
    } catch {
      /* ignore */
    }
    // Open WhatsApp to client with review link
    const phone = inquiry.client_whatsapp.replace(/\D/g, "");
    const digits =
      phone.length === 10 ? `91${phone}` : phone.startsWith("0") ? `91${phone.slice(1)}` : phone;
    const text = `Hi ${inquiry.client_name}, thanks for working with me via ROLLR. If you have a minute, a short review helps other Mumbai clients: ${result.url}`;
    window.open(
      `https://wa.me/${digits}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
    await refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Creator inbox
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Brief inbox</h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Client briefs land here. Accept to open WhatsApp to the{" "}
          <span className="text-foreground">client</span> — your number stays
          private.
          {source === "supabase"
            ? " Synced to your account across devices."
            : signedIn
              ? " Sign in with the account that owns a published listing to see live briefs."
              : " Sign in as a creator to receive briefs on every device."}
        </p>
        {!signedIn && (
          <Button asChild size="sm" variant="outline" className="mt-1">
            <Link href="/login?next=/inbox">Sign in to sync inbox</Link>
          </Button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {error}
          {(error.includes("relation") || error.includes("schema")) &&
            " — run migration 00007_waitlist_and_inquiries.sql"}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", "All"],
            ["pending", `Pending (${pendingCount})`],
            ["accepted", "Accepted"],
            ["declined", "Declined"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
        <Button asChild variant="outline" size="sm" className="ml-auto">
          <Link href="/">Back to Discover</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading briefs…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No briefs here yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Publish your portfolio, share your profile link, and clients use{" "}
            <strong className="text-foreground">Send brief</strong>. Accept here
            to WhatsApp them.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((inquiry) => (
            <li key={inquiry.id}>
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {inquiry.client_name}{" "}
                        <span className="font-normal text-muted-foreground">
                          → {inquiry.creator_name}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        <span>{briefTypeLabel(inquiry.brief_type)}</span>
                        <span>{inquiry.category}</span>
                        <span>{inquiry.location}</span>
                        {inquiry.event_date && (
                          <span>{formatDateIn(inquiry.event_date)}</span>
                        )}
                      </CardDescription>
                    </div>
                    <StatusBadge status={inquiry.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="leading-relaxed text-muted-foreground">
                    {inquiry.message}
                  </p>
                  {inquiry.budget && (
                    <p className="text-xs text-muted-foreground">
                      Budget:{" "}
                      <span className="text-foreground">{inquiry.budget}</span>
                    </p>
                  )}
                  {inquiry.status === "accepted" && (
                    <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs">
                      <p className="font-medium text-foreground">
                        Client WhatsApp (shared after accept)
                      </p>
                      <p className="font-mono text-muted-foreground">
                        {inquiry.client_whatsapp}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" className="font-semibold">
                          <a
                            href={creatorToClientWhatsAppUrl({
                              clientWhatsapp: inquiry.client_whatsapp,
                              clientName: inquiry.client_name,
                              creatorName: inquiry.creator_name,
                              briefType: inquiry.brief_type,
                              eventDate: inquiry.event_date,
                              location: inquiry.location,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp client
                            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void requestReview(inquiry)}
                        >
                          Job done · request review
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        After the job, request a review — link copies + opens WA
                        so ratings stay on ROLLR (not only in WhatsApp chat).
                      </p>
                    </div>
                  )}
                  {inquiry.status === "pending" && (
                    <p className="text-[11px] text-muted-foreground">
                      Client contact is hidden until you accept.
                    </p>
                  )}
                </CardContent>
                {inquiry.status === "pending" && (
                  <CardFooter className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                    <Button
                      size="sm"
                      className="font-semibold"
                      onClick={() => void accept(inquiry)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Accept & open WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void decline(inquiry.id)}
                    >
                      <XCircle className="h-4 w-4" />
                      Decline
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Inquiry["status"] }) {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-400">
        Pending
      </Badge>
    );
  }
  if (status === "accepted") {
    return (
      <Badge className="bg-primary text-primary-foreground hover:bg-primary">
        Accepted
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      Declined
    </Badge>
  );
}
