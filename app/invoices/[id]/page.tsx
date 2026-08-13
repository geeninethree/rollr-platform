"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Copy, Loader2, Printer } from "lucide-react";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { Button } from "@/components/ui/button";
import {
  fetchInvoiceById,
  publicInvoicePath,
  updateInvoiceStatus,
  type Invoice,
} from "@/lib/invoices";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
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
      router.replace(`/login?next=/invoices/${id}`);
      return;
    }
    const result = await fetchInvoiceById(supabase, id, user.id);
    if (result.error || !result.invoice) {
      setError(result.error || "Not found");
      setLoading(false);
      return;
    }
    setInvoice(result.invoice);
    setShareUrl(
      `${window.location.origin}${publicInvoicePath(result.invoice.public_token)}`
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

  async function markPaid() {
    if (!invoice) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const res = await updateInvoiceStatus(supabase, invoice.id, user.id, "paid");
    if (!res.ok) {
      setError(res.error || "Couldn’t update");
      return;
    }
    setInvoice({ ...invoice, status: "paid" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="page-shell py-16 text-center">
        <p className="text-sm text-destructive">{error || "Not found"}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/invoices">Back to invoices</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-grid-fade">
      <div className="page-shell space-y-6 py-8 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Invoice
            </p>
            <h1 className="text-xl font-semibold text-white">
              {invoice.invoice_number}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print / PDF
            </Button>
            <Button type="button" variant="outline" onClick={() => void copyLink()}>
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy share link"}
            </Button>
            {invoice.status !== "paid" && (
              <Button type="button" onClick={() => void markPaid()}>
                Mark paid
              </Button>
            )}
            <Button asChild variant="ghost">
              <Link href="/invoices">All invoices</Link>
            </Button>
          </div>
        </div>
        {shareUrl && (
          <p className="break-all rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[11px] text-white/40">
            {shareUrl}
          </p>
        )}
      </div>

      <div className="page-shell pb-16 print:max-w-none print:p-0">
        <InvoiceDocument invoice={invoice} />
      </div>
    </div>
  );
}
