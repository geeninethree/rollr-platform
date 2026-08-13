"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  ClipboardList,
  FileText,
  FolderOpen,
  IndianRupee,
  Lock,
  Package,
  Receipt,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BUSINESS_KIT_TOOLS } from "@/lib/business-kit";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "/invoices": Receipt,
  "/quotes": FileText,
  "/bookings": CalendarCheck,
  "/rate-cards": IndianRupee,
  "/delivery": Package,
  "/clients": FolderOpen,
  "/earnings": ClipboardList,
  "/inbox": Send,
};

export default function ToolsPage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setSignedIn(false);
      return;
    }
    void supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user));
    });
  }, []);

  const unlocked = signedIn === true;

  return (
    <div className="bg-grid-fade">
      <div className="page-shell max-w-4xl space-y-8 py-8 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl space-y-2">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-primary">
              For creators
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Business kit
            </h1>
            <p className="text-sm leading-relaxed text-white/45">
              Quote → book → invoice → deliver without losing the thread in
              WhatsApp. You stay the seller — ROLLR never takes a cut or
              collects payment.
            </p>
          </div>
          {!unlocked && signedIn !== null && (
            <div className="flex flex-col gap-2 sm:items-end">
              <Button asChild className="font-semibold">
                <Link href="/signup?role=creator&next=/tools">
                  Sign up free to use
                </Link>
              </Button>
              <Link
                href="/login?next=/tools"
                className="text-center text-xs text-white/40 hover:text-primary"
              >
                Already have an account? Sign in
              </Link>
            </div>
          )}
        </div>

        {!unlocked && signedIn !== null && (
          <div className="rounded-2xl border border-primary/25 bg-primary/10 px-5 py-4 text-sm">
            <p className="font-medium text-foreground">
              Preview only — tools unlock after creator signup
            </p>
            <p className="mt-1 text-muted-foreground">
              Alpha listing is free. Same account powers Inbox, portfolio, and
              this kit.{" "}
              <Link href="/list" className="font-medium text-primary hover:underline">
                See pricing & plan →
              </Link>
            </p>
          </div>
        )}

        <ul className="grid gap-3 sm:grid-cols-2">
          {BUSINESS_KIT_TOOLS.map((t) => {
            const Icon = ICONS[t.href] || FileText;
            const href = unlocked
              ? t.href
              : `/signup?role=creator&next=${encodeURIComponent(t.href)}`;
            return (
              <li key={t.href}>
                <Link href={href} className="block h-full">
                  <Card
                    className={cn(
                      "h-full transition-colors hover:border-primary/30",
                      !unlocked && "opacity-95"
                    )}
                  >
                    <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base text-white">
                          {t.title}
                          {!unlocked && (
                            <Lock className="h-3.5 w-3.5 text-white/30" />
                          )}
                        </CardTitle>
                        <CardContent className="space-y-1 p-0 pt-1">
                          <p className="text-sm text-white/45">{t.desc}</p>
                          <p className="text-xs leading-relaxed text-white/30">
                            {t.pitch}
                          </p>
                          {!unlocked && (
                            <p className="pt-1 text-[11px] font-medium text-primary/80">
                              Sign up as creator →
                            </p>
                          )}
                        </CardContent>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
          <p className="text-sm font-medium text-white/90">How it fits the job</p>
          <ol className="mt-3 space-y-2 text-sm text-white/45">
            <li>
              <span className="font-medium text-white/70">1. Brief</span> — client
              sends request → you accept in Inbox
            </li>
            <li>
              <span className="font-medium text-white/70">2. Quote / book</span> —
              estimate or booking confirmation with deposit
            </li>
            <li>
              <span className="font-medium text-white/70">3. Invoice</span> — bill
              them, share link, payment reminder on WhatsApp
            </li>
            <li>
              <span className="font-medium text-white/70">4. Deliver</span> —
              delivery note + optional review request
            </li>
          </ol>
        </div>

        <p className="text-center text-xs text-white/30">
          <Link href="/list" className="text-primary/80 hover:underline">
            Creator plan
          </Link>
          {" · "}
          <Link
            href="/guides/creators"
            className="text-primary/80 hover:underline"
          >
            Creator guide
          </Link>
          {" · "}
          <Link href="/" className="text-primary/80 hover:underline">
            Browse directory
          </Link>
        </p>
      </div>
    </div>
  );
}
