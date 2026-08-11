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
import { checkIsAdmin } from "@/lib/admin";
import {
  fetchListingsByStatus,
  setListingStatus,
  type AdminListingRow,
} from "@/lib/admin-listings";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  activateRecruiterByEmail,
  fetchWaitlist,
  updateWaitlistStatus,
  waitlistRoleLabel,
  type WaitlistSignup,
  type WaitlistStatus,
} from "@/lib/waitlist";
import { cn } from "@/lib/utils";

const WAITLIST_STATUSES: WaitlistStatus[] = [
  "pending",
  "contacted",
  "approved",
  "rejected",
];

type Tab = "waitlist" | "listings";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState<Tab>("listings");
  const [rows, setRows] = useState<WaitlistSignup[]>([]);
  const [listings, setListings] = useState<AdminListingRow[]>([]);
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

    let isAdminFlag: boolean | null = null;
    if (auth.user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", auth.user.id)
        .maybeSingle();
      isAdminFlag = (prof?.is_admin as boolean | undefined) ?? null;
    }

    const ok = await checkIsAdmin({ email: userEmail, isAdminFlag });
    if (!ok) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);

    // UI allowlist alone is not enough — RLS needs profiles.is_admin
    const missingDbAdmin = !isAdminFlag;

    const [wl, li] = await Promise.all([
      fetchWaitlist(supabase),
      fetchListingsByStatus(supabase, "pending_review"),
    ]);
    if (missingDbAdmin) {
      setError(
        `profiles.is_admin is false for ${userEmail || "this account"}. Email allowlist opens this page but RLS blocks data. Run in Supabase SQL: update public.profiles set is_admin = true where email = '${userEmail || "you@example.com"}'; Also apply migrations 00008 + 00011.`
      );
    } else if (wl.error || li.error) {
      const raw = wl.error || li.error || "";
      const lower = raw.toLowerCase();
      let hint = "";
      if (
        lower.includes("column") ||
        lower.includes("does not exist") ||
        lower.includes("relation")
      ) {
        hint = " — run migrations 00008–00012 in Supabase SQL Editor.";
      }
      setError(`${raw}${hint}`);
    } else setError(null);
    setRows(wl.rows);
    setListings(li.rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: WaitlistStatus) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusyId(id);
    const row = rows.find((r) => r.id === id);
    const result = await updateWaitlistStatus(supabase, id, status);
    if (result.error) {
      setBusyId(null);
      setError(result.error);
      return;
    }
    // Approving recruiter waitlist → try activate multi-job on their account
    if (status === "approved" && row?.role === "recruiter") {
      const act = await activateRecruiterByEmail(supabase, row.email);
      if (!act.ok) {
        setError(
          `Waitlist approved. Multi-job activation: ${act.error}`
        );
      }
    }
    setBusyId(null);
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, updated_at: new Date().toISOString() }
          : r
      )
    );
  }

  async function setListing(id: string, status: "published" | "rejected" | "draft") {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusyId(id);
    const result = await setListingStatus(supabase, id, status);
    setBusyId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setListings((prev) => prev.filter((l) => l.id !== id));
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
          Sign in as an admin (
          <code className="text-primary">profiles.is_admin</code> or{" "}
          <code className="text-primary">NEXT_PUBLIC_ADMIN_EMAILS</code>).
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

  const pendingWl = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="bg-grid-fade">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Ops
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Admin
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {listings.length} listings pending · {pendingWl} waitlist pending ·{" "}
              {email}
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

        <div className="flex gap-2">
          {(
            [
              ["listings", `Listings (${listings.length})`],
              ["waitlist", `Waitlist (${rows.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                tab === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <p
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
            role="alert"
          >
            {error}
          </p>
        )}

        {tab === "listings" && (
          <ul className="space-y-3">
            {listings.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                No listings waiting for review. Creators use Portfolio → Submit
                for review.
              </li>
            ) : (
              listings.map((row) => (
                <li key={row.id}>
                  <Card className="border-border bg-card/80">
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">
                            {row.profiles?.full_name || "Creator"}
                          </CardTitle>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {row.profiles?.email}
                            {row.tagline ? ` · ${row.tagline}` : ""}
                          </p>
                        </div>
                        <Badge className="bg-amber-500/15 text-amber-200">
                          Pending review
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">
                        {(row.categories || []).join(", ") || "No categories"}
                        {" · "}
                        {(row.sub_regions || []).slice(0, 4).join(", ") ||
                          "No areas"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/creators/${row.id}`} target="_blank">
                            Preview
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          className="font-semibold"
                          disabled={busyId === row.id}
                          onClick={() => void setListing(row.id, "published")}
                        >
                          Approve &amp; publish
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === row.id}
                          onClick={() => void setListing(row.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))
            )}
          </ul>
        )}

        {tab === "waitlist" && (
          <ul className="space-y-3">
            {rows.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                No waitlist entries yet.
              </li>
            ) : (
              rows.map((row) => (
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
                        Interest:{" "}
                        <span className="text-foreground">
                          {waitlistRoleLabel(row.role)}
                        </span>
                        {row.primary_category
                          ? ` · ${row.primary_category}`
                          : ""}
                      </p>
                      {row.role === "recruiter" && (
                        <p className="text-[11px] text-muted-foreground">
                          Approve → tries to set multi-job active on matching
                          account (needs migration 00011 + profiles.is_admin).
                          No auto-email to the user — message them yourself.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {WAITLIST_STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            disabled={busyId === row.id || row.status === s}
                            onClick={() => void setStatus(row.id, s)}
                            className={cn(
                              "rounded-md border px-2 py-1 text-[11px] font-medium capitalize disabled:opacity-50",
                              row.status === s
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-secondary text-muted-foreground"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
