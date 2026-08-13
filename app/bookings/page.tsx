"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createBooking,
  DEFAULT_TERMS,
  draftBookingFromInquiry,
  fetchMyBookings,
  formatBookingMoney,
  type Booking,
  type CreateBookingInput,
} from "@/lib/bookings";
import { fetchMyInquiries } from "@/lib/inquiries";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Inquiry } from "@/lib/types";

export default function BookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [accepted, setAccepted] = useState<Inquiry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateBookingInput>({
    creator_name: "",
    client_name: "",
    package_title: "",
    package_description: "",
    deposit_amount: 0,
    total_amount: 0,
    terms: DEFAULT_TERMS,
  });

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
      router.replace("/login?next=/bookings");
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
      creator_name: f.creator_name || profile?.full_name || user.email?.split("@")[0] || "",
      creator_email: f.creator_email || profile?.email || user.email || "",
      creator_phone: f.creator_phone || profile?.phone || "",
    }));
    const b = await fetchMyBookings(supabase, user.id);
    if (b.error) setError(b.error);
    setBookings(b.bookings);
    const briefs = await fetchMyInquiries(supabase, user.id);
    setAccepted(briefs.items.filter((i) => i.status === "accepted" || i.status === "pending"));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || saving) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const result = await createBooking(supabase, userId, form);
    setSaving(false);
    if (result.error || !result.booking) {
      setError(result.error || "Couldn’t create booking.");
      return;
    }
    router.push(`/bookings/${result.booking.id}`);
  }

  if (loading) {
    return (
      <div className="page-shell flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading bookings…
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
              Booking confirmations
            </h1>
            <p className="max-w-lg text-sm text-white/45">
              Lock date, package, deposit, and terms — share a link with the client.
            </p>
          </div>
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            {showForm ? "Hide" : "New booking"}
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
              <CardTitle className="text-base text-white">From briefs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {accepted.slice(0, 6).map((inq) => (
                <button
                  key={inq.id}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      ...draftBookingFromInquiry(inq, {
                        name: f.creator_name,
                        email: f.creator_email,
                        phone: f.creator_phone,
                      }),
                    }));
                    setShowForm(true);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5 text-left text-sm hover:border-primary/30"
                >
                  <span>
                    <span className="font-medium text-white/90">{inq.client_name}</span>
                    <span className="mt-0.5 block text-xs text-white/40">
                      {inq.category} · {inq.event_date || "date TBD"}
                    </span>
                  </span>
                  <span className="text-xs text-primary">Prefill →</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-white">Create confirmation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void onCreate(e)} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    required
                    placeholder="Your name"
                    value={form.creator_name}
                    onChange={(e) => setForm((f) => ({ ...f, creator_name: e.target.value }))}
                    className="bg-background/50"
                  />
                  <Input
                    required
                    placeholder="Client name"
                    value={form.client_name}
                    onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                    className="bg-background/50"
                  />
                  <Input
                    placeholder="Client phone"
                    value={form.client_phone || ""}
                    onChange={(e) => setForm((f) => ({ ...f, client_phone: e.target.value }))}
                    className="bg-background/50"
                  />
                  <Input
                    type="date"
                    value={form.event_date || ""}
                    onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                    className="bg-background/50"
                  />
                  <Input
                    placeholder="Location"
                    value={form.location || ""}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className="bg-background/50"
                  />
                  <Input
                    required
                    placeholder="Package title"
                    value={form.package_title}
                    onChange={(e) => setForm((f) => ({ ...f, package_title: e.target.value }))}
                    className="bg-background/50 sm:col-span-2"
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Deposit ₹"
                    value={form.deposit_amount || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        deposit_amount: Number(e.target.value) || 0,
                      }))
                    }
                    className="bg-background/50"
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Total ₹"
                    value={form.total_amount || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        total_amount: Number(e.target.value) || 0,
                      }))
                    }
                    className="bg-background/50"
                  />
                </div>
                <textarea
                  rows={4}
                  value={form.terms || ""}
                  onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
                  placeholder="Terms"
                  className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                />
                <Button type="submit" className="w-full font-semibold" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarCheck className="h-4 w-4" />
                  )}
                  Create booking
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/35">
            Your bookings
          </h2>
          {bookings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/40">
              No bookings yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {bookings.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/bookings/${b.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-4 py-3 hover:border-primary/30"
                  >
                    <div>
                      <p className="font-medium text-white/90">{b.client_name}</p>
                      <p className="text-xs text-white/40">
                        {b.package_title}
                        {b.event_date ? ` · ${b.event_date}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {b.status}
                      </Badge>
                      <span className="font-semibold tabular-nums text-primary">
                        {formatBookingMoney(b.total_amount)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-xs text-white/30">
          <Link href="/tools" className="text-primary/80 hover:underline">
            ← All tools
          </Link>
        </p>
      </div>
    </div>
  );
}
