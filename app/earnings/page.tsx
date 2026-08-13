"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  earningsToCsv,
  summarizeEarnings,
} from "@/lib/clients-folder";
import { fetchMyInvoices, formatInvoiceMoney, type Invoice } from "@/lib/invoices";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function EarningsPage() {
  const router = useRouter();
  const yearNow = new Date().getFullYear();
  const [year, setYear] = useState(yearNow);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
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
      router.replace("/login?next=/earnings");
      return;
    }
    const inv = await fetchMyInvoices(supabase, user.id);
    if (inv.error) setError(inv.error);
    setInvoices(inv.invoices);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(
    () => summarizeEarnings(invoices, year),
    [invoices, year]
  );

  function downloadCsv() {
    const csv = earningsToCsv(invoices, year);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rollr-earnings-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="page-shell flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading earnings…
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
              Earnings / GST
            </h1>
            <p className="max-w-lg text-sm text-white/45">
              Summary from your ROLLR invoices. For your books only — not a tax filing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background/50 px-3 text-sm"
            >
              {[yearNow, yearNow - 1, yearNow - 2].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={downloadCsv}>
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/50">Paid total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-primary">
                {formatInvoiceMoney(summary.totalPaid)}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {summary.paidCount} paid invoice{summary.paidCount === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/50">GST on paid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-white">
                {formatInvoiceMoney(summary.totalGstOnPaid)}
              </p>
              <p className="mt-1 text-xs text-white/40">
                From invoices with GST % set
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/50">Invoiced (all open+paid)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-white">
                {formatInvoiceMoney(summary.totalInvoiced)}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {summary.invoiceCount} docs · {summary.draftOrSentCount} unpaid
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-white">By month (paid)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.byMonth.map((m) => (
                <li
                  key={m.month}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-white/50">{MONTHS[m.month - 1]}</span>
                  <span className="tabular-nums text-white/80">
                    {m.count > 0
                      ? `${formatInvoiceMoney(m.paid)} · ${m.count}`
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-white/30">
          <Link href="/invoices" className="text-primary/80 hover:underline">
            Invoices
          </Link>
          {" · "}
          <Link href="/tools" className="text-primary/80 hover:underline">
            All tools
          </Link>
        </p>
      </div>
    </div>
  );
}
