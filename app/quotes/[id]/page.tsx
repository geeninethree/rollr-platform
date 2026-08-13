"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Copy, FileText, Loader2, Printer } from "lucide-react";
import { QuoteDocument } from "@/components/docs/quote-document";
import { ShareWhatsAppButton } from "@/components/docs/share-whatsapp-button";
import { Button } from "@/components/ui/button";
import { createInvoice, draftFromQuote } from "@/lib/invoices";
import {
  fetchQuoteById,
  publicQuotePath,
  updateQuoteStatus,
  type Quote,
} from "@/lib/quotes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
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
      router.replace(`/login?next=/quotes/${id}`);
      return;
    }
    const result = await fetchQuoteById(supabase, id, user.id);
    if (result.error || !result.quote) {
      setError(result.error || "Not found");
      setLoading(false);
      return;
    }
    setQuote(result.quote);
    setShareUrl(
      `${window.location.origin}${publicQuotePath(result.quote.public_token)}`
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

  async function setStatus(status: Quote["status"]) {
    if (!quote) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const res = await updateQuoteStatus(supabase, quote.id, user.id, status);
    if (!res.ok) {
      setError(res.error || "Couldn’t update");
      return;
    }
    setQuote({ ...quote, status });
  }

  async function convertToInvoice() {
    if (!quote || converting) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setConverting(true);
    setError(null);
    const result = await createInvoice(
      supabase,
      user.id,
      draftFromQuote(quote)
    );
    setConverting(false);
    if (result.error || !result.invoice) {
      setError(result.error || "Couldn’t create invoice.");
      return;
    }
    // Mark quote accepted when converting
    if (quote.status !== "accepted") {
      void updateQuoteStatus(supabase, quote.id, user.id, "accepted");
    }
    router.push(`/invoices/${result.invoice.id}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="page-shell py-16 text-center">
        <p className="text-sm text-destructive">{error || "Not found"}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/quotes">Back</Link>
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
              Quote
            </p>
            <h1 className="text-xl font-semibold text-white">
              {quote.quote_number}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" /> Print / PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyLink()}
            >
              <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy link"}
            </Button>
            <ShareWhatsAppButton
              clientPhone={quote.client_phone}
              clientName={quote.client_name}
              creatorName={quote.seller_name}
              docKind="quote"
              docNumber={quote.quote_number}
              shareUrl={shareUrl}
              amount={quote.total}
            />
            {quote.status !== "accepted" && (
              <Button type="button" onClick={() => void setStatus("accepted")}>
                Mark accepted
              </Button>
            )}
            <Button
              type="button"
              className="font-semibold"
              disabled={converting}
              onClick={() => void convertToInvoice()}
            >
              {converting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Convert to invoice
            </Button>
            <Button asChild variant="ghost">
              <Link href="/quotes">All quotes</Link>
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
        <QuoteDocument quote={quote} />
      </div>
    </div>
  );
}
