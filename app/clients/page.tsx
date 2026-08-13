"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchClientFolders,
  type ClientFolder,
} from "@/lib/clients-folder";
import { formatInvoiceMoney } from "@/lib/invoices";
import { formatDateIn } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ClientsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<ClientFolder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

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
      router.replace("/login?next=/clients");
      return;
    }
    const result = await fetchClientFolders(supabase, user.id);
    if (result.error) setError(result.error);
    setFolders(result.folders);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="page-shell flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading clients…
      </div>
    );
  }

  return (
    <div className="bg-grid-fade">
      <div className="page-shell max-w-3xl space-y-8 py-8 sm:py-12">
        <div className="space-y-2">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-primary">
            Creator tools
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Client folder
          </h1>
          <p className="max-w-lg text-sm text-white/45">
            Briefs, quotes, bookings, invoices, and delivery — grouped by client.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </p>
        )}

        {folders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/40">
            No clients yet. Accept a brief or create an invoice to start a folder.
          </p>
        ) : (
          <ul className="space-y-3">
            {folders.map((f) => {
              const open = openKey === f.key;
              return (
                <li
                  key={f.key}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenKey(open ? null : f.key)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{f.name}</p>
                      <p className="text-xs text-white/40">
                        {[f.phone, f.email].filter(Boolean).join(" · ") ||
                          "No contact"}
                        {f.lastActivity
                          ? ` · last ${formatDateIn(f.lastActivity)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {f.briefs.length} brief
                        {f.briefs.length === 1 ? "" : "s"}
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums text-primary">
                        {formatInvoiceMoney(f.totalPaid)}
                        <span className="ml-1 text-xs font-normal text-white/35">
                          paid
                        </span>
                      </span>
                    </div>
                  </button>

                  {open && (
                    <div className="space-y-4 border-t border-white/[0.06] px-4 py-4 sm:px-5">
                      <Section
                        title="Briefs"
                        empty="None"
                        items={f.briefs.map((b) => ({
                          id: b.id,
                          label: `${b.category} · ${b.status}`,
                          href: "/inbox",
                          meta: b.event_date || undefined,
                        }))}
                      />
                      <Section
                        title="Quotes"
                        empty="None"
                        items={f.quotes.map((q) => ({
                          id: q.id,
                          label: q.quote_number,
                          href: `/quotes/${q.id}`,
                          meta: formatInvoiceMoney(q.total),
                        }))}
                      />
                      <Section
                        title="Bookings"
                        empty="None"
                        items={f.bookings.map((b) => ({
                          id: b.id,
                          label: b.package_title,
                          href: `/bookings/${b.id}`,
                          meta: b.event_date || undefined,
                        }))}
                      />
                      <Section
                        title="Invoices"
                        empty="None"
                        items={f.invoices.map((i) => ({
                          id: i.id,
                          label: `${i.invoice_number} · ${i.status}`,
                          href: `/invoices/${i.id}`,
                          meta: formatInvoiceMoney(i.total),
                        }))}
                      />
                      <Section
                        title="Delivery"
                        empty="None"
                        items={f.deliveryNotes.map((n) => ({
                          id: n.id,
                          label: n.project_title,
                          href: `/delivery/${n.id}`,
                          meta: n.note_number,
                        }))}
                      />
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/quotes?prefill=${encodeURIComponent(f.name)}`}
                          >
                            New quote
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href="/invoices">New invoice</Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href="/bookings">New booking</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-center text-xs text-white/30">
          <Link href="/tools" className="text-primary/80 hover:underline">
            ← All tools
          </Link>
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { id: string; label: string; href: string; meta?: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-white/35">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-1 text-xs text-white/30">{empty}</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={it.href}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-white/70 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <span className="truncate">{it.label}</span>
                {it.meta && (
                  <span className="shrink-0 text-xs text-white/35">{it.meta}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
