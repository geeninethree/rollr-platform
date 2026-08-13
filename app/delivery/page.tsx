"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createDeliveryNote,
  draftDeliveryFromInquiry,
  fetchMyDeliveryNotes,
  type CreateDeliveryNoteInput,
  type DeliveryItem,
  type DeliveryNote,
} from "@/lib/delivery-notes";
import { fetchMyInquiries } from "@/lib/inquiries";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Inquiry } from "@/lib/types";

export default function DeliveryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [accepted, setAccepted] = useState<Inquiry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateDeliveryNoteInput>({
    creator_name: "",
    client_name: "",
    project_title: "",
    items: [{ description: "Final selects", quantity: 1 }],
    access_note: "",
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
      router.replace("/login?next=/delivery");
      return;
    }
    setUserId(user.id);
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    setForm((f) => ({
      ...f,
      creator_name: f.creator_name || profile?.full_name || user.email?.split("@")[0] || "",
    }));
    const n = await fetchMyDeliveryNotes(supabase, user.id);
    if (n.error) setError(n.error);
    setNotes(n.notes);
    const briefs = await fetchMyInquiries(supabase, user.id);
    setAccepted(briefs.items.filter((i) => i.status === "accepted"));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateItem(i: number, patch: Partial<DeliveryItem>) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    }));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || saving) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    setError(null);
    const result = await createDeliveryNote(supabase, userId, form);
    setSaving(false);
    if (result.error || !result.note) {
      setError(result.error || "Couldn’t create delivery note.");
      return;
    }
    router.push(`/delivery/${result.note.id}`);
  }

  if (loading) {
    return (
      <div className="page-shell flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
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
              Delivery notes
            </h1>
            <p className="max-w-lg text-sm text-white/45">
              Confirm what you handed over — selects, reels, drive links.
            </p>
          </div>
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            {showForm ? "Hide" : "New note"}
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
              <CardTitle className="text-base text-white">From accepted briefs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {accepted.slice(0, 6).map((inq) => (
                <button
                  key={inq.id}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      ...draftDeliveryFromInquiry(inq, f.creator_name),
                    }));
                    setShowForm(true);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5 text-left text-sm hover:border-primary/30"
                >
                  <span className="font-medium text-white/90">{inq.client_name}</span>
                  <span className="text-xs text-primary">Prefill →</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-white">Create delivery note</CardTitle>
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
                    required
                    placeholder="Project title"
                    value={form.project_title}
                    onChange={(e) => setForm((f) => ({ ...f, project_title: e.target.value }))}
                    className="bg-background/50 sm:col-span-2"
                  />
                  <Input
                    type="date"
                    value={form.delivery_date || ""}
                    onChange={(e) => setForm((f) => ({ ...f, delivery_date: e.target.value }))}
                    className="bg-background/50"
                  />
                  <Input
                    placeholder="Drive / gallery link"
                    value={form.access_note || ""}
                    onChange={(e) => setForm((f) => ({ ...f, access_note: e.target.value }))}
                    className="bg-background/50"
                  />
                </div>
                {form.items.map((it, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_80px]">
                    <Input
                      required
                      placeholder="Deliverable"
                      value={it.description}
                      onChange={(e) => updateItem(i, { description: e.target.value })}
                      className="bg-background/50"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={it.quantity || ""}
                      onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 0 })}
                      className="bg-background/50"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs text-primary"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      items: [...f.items, { description: "", quantity: 1 }],
                    }))
                  }
                >
                  + Add item
                </button>
                <Button type="submit" className="w-full font-semibold" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                  Create delivery note
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {notes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/40">
              No delivery notes yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/delivery/${n.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-4 py-3 hover:border-primary/30"
                  >
                    <div>
                      <p className="font-medium text-white/90">{n.client_name}</p>
                      <p className="text-xs text-white/40">
                        {n.project_title} · {n.note_number}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {n.status}
                    </Badge>
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
