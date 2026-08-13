"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Copy, Loader2, Printer } from "lucide-react";
import { RateCardDocument } from "@/components/docs/rate-card-document";
import { ShareWhatsAppButton } from "@/components/docs/share-whatsapp-button";
import { Button } from "@/components/ui/button";
import {
  fetchRateCardById,
  publicRateCardPath,
  type RateCard,
} from "@/lib/rate-cards";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RateCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [card, setCard] = useState<RateCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
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
      router.replace(`/login?next=/rate-cards/${id}`);
      return;
    }
    const result = await fetchRateCardById(supabase, id, user.id);
    if (result.error || !result.card) {
      setError(result.error || "Not found");
      setLoading(false);
      return;
    }
    setCard(result.card);
    setShareUrl(
      `${window.location.origin}${publicRateCardPath(result.card.public_token)}`
    );
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (error || !card) {
    return (
      <div className="page-shell py-16 text-center">
        <p className="text-sm text-destructive">{error || "Not found"}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/rate-cards">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-grid-fade">
      <div className="page-shell space-y-4 py-8 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Rate card
            </p>
            <h1 className="text-xl font-semibold text-white">{card.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print / PDF
            </Button>
            <Button type="button" variant="outline" onClick={() => void copyLink()}>
              <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy public link"}
            </Button>
            <ShareWhatsAppButton
              creatorName={card.creator_name}
              docKind="rate card"
              shareUrl={shareUrl}
              label="Share on WhatsApp"
            />
            <Button asChild variant="ghost">
              <Link href="/rate-cards">All rate cards</Link>
            </Button>
          </div>
        </div>
        {shareUrl && (
          <p className="break-all rounded-xl border border-white/10 px-3 py-2 font-mono text-[11px] text-white/40">
            {shareUrl}
          </p>
        )}
      </div>
      <div className="page-shell pb-16 print:max-w-none print:p-0">
        <RateCardDocument card={card} />
      </div>
    </div>
  );
}
