"use client";

import { useEffect, useState } from "react";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { profileShareUrl } from "@/lib/referrals";

type ProfileShareCardProps = {
  listingId: string;
  creatorName: string;
  /** Compact row vs full card */
  compact?: boolean;
};

export function ProfileShareCard({
  listingId,
  creatorName,
  compact,
}: ProfileShareCardProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(profileShareUrl(window.location.origin, listingId));
  }, [listingId]);

  if (!url) return null;

  if (compact) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Share your ROLLR profile
        </p>
        <p className="break-all font-mono text-[11px] text-muted-foreground">
          {url}
        </p>
        <CopyLinkButton
          url={url}
          label="Copy profile link"
          shareTitle={`${creatorName} on ROLLR`}
          shareText={`Check out ${creatorName} on ROLLR — Mumbai visual creators.`}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold">Share your ROLLR profile</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Send this link to clients, WhatsApp groups, or Instagram bio.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
        <p className="break-all font-mono text-[11px] text-muted-foreground">
          {url}
        </p>
      </div>
      <CopyLinkButton
        url={url}
        label="Copy profile link"
        shareTitle={`${creatorName} on ROLLR`}
        shareText={`Check out ${creatorName} on ROLLR — Mumbai visual creators, zero commission.`}
      />
    </div>
  );
}
