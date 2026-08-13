"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  computeTotals,
  createInvoice,
  draftFromInquiry,
  fetchMyInvoices,
  formatInvoiceMoney,
  type CreateInvoiceInput,
  type Invoice,
  type InvoiceLineItem,
} from "@/lib/invoices";
import { fetchMyInquiries } from "@/lib/inquiries";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Inquiry } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices…
        </div>
      }
    >
      <InvoicesInner />
    </Suspense>
  );
}

function InvoicesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillInquiry = searchParams.get("inquiry");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [accepted, setAccepted] = useState<Inquiry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(Boolean(prefillInquiry));
  const [origin, setOrigin] = useState("");

  const [form, setForm] = useState<CreateInvoiceInput>({
    seller_name: "",
    seller_email: "",
    seller_phone: "",
    seller_gstin: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    line_items: [{ description: "Creative services", quantity: 1, unit_amount: 0 }],
    gst_percent: 0,
    payment_note:
      "Pay the creator directly (UPI / bank). ROLLR does not collect payment.",
    notes: "",
  });

  const totals = useMemo(
    () => computeTotals(form.line_items, form.gst_percent || 0),
    [form.line_items, form.gst_percent]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Couldn’t connect. Try again.");
      setLoading(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login?next=/invoices");
      return;
    }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .maybeSingle();

    setForm((f) => ({
      ...f,
      seller_name:
        f.seller_name ||
        profile?.full_name ||
        user.email?.split("@")[0] ||
        "",
      seller_email: f.seller_email || profile?.email || user.email || "",
      seller_phone: f.seller_phone || profile?.phone || "",
    }));

    const inv = await fetchMyInvoices(supabase, user.id);
    if (inv.error) setError(inv.error);
    setInvoices(inv.invoices);

    const briefs = await fetchMyInquiries(supabase, user.id);
    setAccepted(briefs.items.filter((i) => i.status === "accepted"));

    if (prefillInquiry) {
      const match = briefs.items.find((i) => i.id === prefillInquiry);
      if (match) {
        setForm((f) => ({
          ...f,
          ...draftFromInquiry(match, {
            name: profile?.full_name || user.email?.split("@")[0] || "Creator",
            email: profile?.email || user.email || undefined,
            phone: profile?.phone || undefined,
          }),
        }));
        setShowForm(true);
      }
    }

    setLoading(false);
  }, [router, prefillInquiry]);

  useEffect(() => {
    setOrigin(window.location.origin);
    void load();
  }, [load]);

  function updateLine(i: number, patch: Partial<InvoiceLineItem>) {
    setForm((f) => {
      const line_items = f.line_items.map((li, idx) =>
        idx === i ? { ...li, ...patch } : li
      );
      return { ...f, line_items };
    });
  }

  function addLine() {
    setForm((f) => ({
      ...f,
      line_items: [
        ...f.line_items,
        { description: "", quantity: 1, unit_amount: 0 },
      ],
    }));
  }

  function removeLine(i: number) {
    setForm((f) => ({
      ...f,
      line_items:
        f.line_items.length <= 1
          ? f.line_items
          : f.line_items.filter((_, idx) => idx !== i),
    }));
  }

  function prefillFromBrief(inquiry: Inquiry) {
    setForm((f) => ({
      ...f,
      ...draftFromInquiry(inquiry, {
        name: f.seller_name,
        email: f.seller_email,
        phone: f.seller_phone,
      }),
    }));
    setShowForm(true);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || saving) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const result = await createInvoice(supabase, userId, form);
    setSaving(false);
    if (result.error || !result.invoice) {
      setError(result.error || "Couldn’t create invoice.");
      return;
    }
    router.push(`/invoices/${result.invoice.id}`);
  }

  if (loading) {
    return (
      <div className="page-shell flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices…
      </div>
    );
  }

  return (
    <div className="bg-grid-fade">
      <div className="page-shell max-w-3xl space-y-8 py-8 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-primary">
              Creator tools
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Invoices
            </h1>
            <p className="max-w-lg text-sm text-white/45">
              Generate invoices for clients after a job. You are the seller —
              ROLLR never takes a cut or collects payment.
            </p>
          </div>
          <Button
            type="button"
            className="font-semibold"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Hide form" : "New invoice"}
          </Button>
        </div>

        {error && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </p>
        )}

        {accepted.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-white">
                From accepted briefs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {accepted.slice(0, 6).map((inq) => (
                <button
                  key={inq.id}
                  type="button"
                  onClick={() => prefillFromBrief(inq)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/30"
                >
                  <span className="min-w-0">
                    <span className="font-medium text-white/90">
                      {inq.client_name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-white/40">
                      {inq.category} · {inq.location}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-primary">
                    Prefill →
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-white">
                Create invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void onCreate(e)} className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs text-white/40">Your name</label>
                    <Input
                      required
                      value={form.seller_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, seller_name: e.target.value }))
                      }
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Your email</label>
                    <Input
                      type="email"
                      value={form.seller_email || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, seller_email: e.target.value }))
                      }
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Your phone</label>
                    <Input
                      value={form.seller_phone || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, seller_phone: e.target.value }))
                      }
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs text-white/40">
                      GSTIN (optional)
                    </label>
                    <Input
                      value={form.seller_gstin || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, seller_gstin: e.target.value }))
                      }
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Client name</label>
                    <Input
                      required
                      value={form.client_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, client_name: e.target.value }))
                      }
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Client phone</label>
                    <Input
                      value={form.client_phone || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, client_phone: e.target.value }))
                      }
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs text-white/40">Client email</label>
                    <Input
                      type="email"
                      value={form.client_email || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, client_email: e.target.value }))
                      }
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-white/40">
                      Line items
                    </p>
                    <button
                      type="button"
                      onClick={addLine}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      + Add line
                    </button>
                  </div>
                  {form.line_items.map((li, i) => (
                    <div
                      key={i}
                      className="grid gap-2 rounded-xl border border-white/[0.06] p-3 sm:grid-cols-[1fr_80px_110px_auto]"
                    >
                      <Input
                        required
                        placeholder="Description"
                        value={li.description}
                        onChange={(e) =>
                          updateLine(i, { description: e.target.value })
                        }
                        className="bg-background/50"
                      />
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="Qty"
                        value={li.quantity || ""}
                        onChange={(e) =>
                          updateLine(i, {
                            quantity: Number(e.target.value) || 0,
                          })
                        }
                        className="bg-background/50"
                      />
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        placeholder="₹ amount"
                        value={li.unit_amount || ""}
                        onChange={(e) =>
                          updateLine(i, {
                            unit_amount: Number(e.target.value) || 0,
                          })
                        }
                        className="bg-background/50"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(i)}
                        disabled={form.line_items.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">GST %</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.gst_percent ?? 0}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          gst_percent: Number(e.target.value) || 0,
                        }))
                      }
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">Due date</label>
                    <Input
                      type="date"
                      value={form.due_date || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, due_date: e.target.value }))
                      }
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/40">Payment note</label>
                  <Input
                    value={form.payment_note || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, payment_note: e.target.value }))
                    }
                    placeholder="UPI / bank details"
                    className="bg-background/50"
                  />
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                  <div className="flex justify-between text-white/50">
                    <span>Subtotal</span>
                    <span className="tabular-nums">
                      {formatInvoiceMoney(totals.subtotal)}
                    </span>
                  </div>
                  {totals.gst_amount > 0 && (
                    <div className="mt-1 flex justify-between text-white/50">
                      <span>GST</span>
                      <span className="tabular-nums">
                        {formatInvoiceMoney(totals.gst_amount)}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between font-semibold text-primary">
                    <span>Total</span>
                    <span className="tabular-nums">
                      {formatInvoiceMoney(totals.total)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full font-semibold"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" /> Create invoice
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/35">
            Your invoices
          </h2>
          {invoices.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/40">
              No invoices yet. Create one or prefill from an accepted brief.
            </p>
          ) : (
            <ul className="space-y-2">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/invoices/${inv.id}`}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-primary/30"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white/90">
                        {inv.client_name}
                      </p>
                      <p className="text-xs text-white/40">
                        {inv.invoice_number} · {inv.issue_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {inv.status}
                      </Badge>
                      <span className="font-semibold tabular-nums text-primary">
                        {formatInvoiceMoney(inv.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-xs text-white/30">
          <Link href="/inbox" className="text-primary/80 hover:underline">
            ← Inbox
          </Link>
          {origin && (
            <span className="mx-2">·</span>
          )}
          Share links use a private token — only people with the link can open.
        </p>
      </div>
    </div>
  );
}
