"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  Inbox,
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
  listInquiries,
  setInquiryStatus,
} from "@/lib/inquiries";
import type { Inquiry } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CreatorInbox() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined">(
    "all"
  );

  const refresh = useCallback(() => {
    setItems(listInquiries());
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
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

  function accept(inquiry: Inquiry) {
    const updated = setInquiryStatus(inquiry.id, "accepted");
    if (!updated) return;
    refresh();
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

  function decline(id: string) {
    setInquiryStatus(id, "declined");
    refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Creator demo
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Brief inbox</h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Client briefs land here. Accept to open WhatsApp to the{" "}
          <span className="text-foreground">client</span> — your number stays
          private. (Demo uses browser storage; no login yet.)
        </p>
      </div>

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

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No briefs here yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            From Discover or Editors, open a profile and use{" "}
            <strong className="text-foreground">Send brief</strong> as a client.
            Then return here to accept.
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
                    <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs">
                      <p className="font-medium text-foreground">
                        Client WhatsApp (shared after accept)
                      </p>
                      <p className="mt-1 font-mono text-muted-foreground">
                        {inquiry.client_whatsapp}
                      </p>
                      <Button asChild size="sm" className="mt-3 font-semibold">
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
                          Message client on WhatsApp
                          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                        </a>
                      </Button>
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
                      onClick={() => accept(inquiry)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Accept & open WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decline(inquiry.id)}
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
