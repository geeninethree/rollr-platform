"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isAdminEmail } from "@/lib/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  fetchWaitlist,
  updateWaitlistStatus,
  type WaitlistSignup,
  type WaitlistStatus,
} from "@/lib/waitlist";
import { cn } from "@/lib/utils";

const STATUSES: WaitlistStatus[] = [
  "pending",
  "contacted",
  "approved",
  "rejected",
];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [rows, setRows] = useState<WaitlistSignup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const userEmail = auth.user?.email ?? null;
    setEmail(userEmail);

    if (!userEmail || !isAdminEmail(userEmail)) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);
    const result = await fetchWaitlist(supabase);
    if (result.error) setError(result.error);
    else setError(null);
    setRows(result.rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: WaitlistStatus) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusyId(id);
    const result = await updateWaitlistStatus(supabase, id, status);
    setBusyId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, updated_at: new Date().toISOString() }
          : r
      )
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading admin…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
        <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Admin only</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with an email listed in{" "}
          <code className="text-primary">ADMIN_EMAILS</code> (or{" "}
          <code className="text-primary">NEXT_PUBLIC_ADMIN_EMAILS</code>) to
          review waitlist signups.
          {email ? (
            <>
              {" "}
              Current: <span className="text-foreground">{email}</span>
            </>
          ) : (
            " You are not signed in."
          )}
        </p>
        <div className="flex justify-center gap-2">
          <Button asChild>
            <Link href="/login?next=/admin">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="bg-grid-fade">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Ops
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Waitlist
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {rows.length} total · {pending} pending · signed in as {email}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            Refresh
          </Button>
        </div>

        {error && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
            {(error.includes("relation") || error.includes("schema")) &&
              " — run migration 00007_waitlist_and_inquiries.sql in Supabase."}
          </p>
        )}

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
            No waitlist entries yet. When someone uses Register interest on{" "}
            <Link href="/list" className="text-primary hover:underline">
              /list
            </Link>
            , they appear here and in Supabase → Table Editor →{" "}
            <code>waitlist_signups</code>.
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id}>
                <Card className="border-border bg-card/80">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {row.full_name}
                        </CardTitle>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          <a
                            href={`mailto:${row.email}`}
                            className="text-primary hover:underline"
                          >
                            {row.email}
                          </a>
                          {row.phone ? ` · ${row.phone}` : ""}
                        </p>
                      </div>
                      <Badge
                        variant={
                          row.status === "pending" ? "default" : "secondary"
                        }
                        className="capitalize"
                      >
                        {row.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      Role:{" "}
                      <span className="text-foreground">
                        {row.role === "both"
                          ? "Photographer + editor"
                          : row.role === "shoot"
                            ? "Photographer"
                            : "Editor"}
                      </span>
                      {row.primary_category
                        ? ` · ${row.primary_category}`
                        : ""}
                      {" · "}
                      {new Date(row.created_at).toLocaleString("en-IN")}
                    </p>
                    {row.notes && (
                      <p className="rounded-md bg-secondary/60 px-3 py-2 text-xs">
                        {row.notes}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={busyId === row.id || row.status === s}
                          onClick={() => void setStatus(row.id, s)}
                          className={cn(
                            "rounded-md border px-2 py-1 text-[11px] font-medium capitalize transition-colors disabled:opacity-50",
                            row.status === s
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {row.status === "approved" && (
                      <p className="text-xs text-muted-foreground">
                        Next: email them{" "}
                        <code className="text-primary">
                          /signup?role=creator&amp;next=/studio
                        </code>{" "}
                        to build portfolio and publish.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          You can also open Supabase Dashboard → Table Editor →{" "}
          <code>waitlist_signups</code> for raw rows / export.
        </p>
      </div>
    </div>
  );
}
