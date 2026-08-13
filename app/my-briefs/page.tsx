"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { briefTypeLabel, formatDateIn } from "@/lib/format";
import { fetchMySentBriefs } from "@/lib/inquiries";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Inquiry } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function MyBriefsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

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
      router.replace("/login?next=/my-briefs");
      return;
    }
    setEmail(user.email || "");
    const result = await fetchMySentBriefs(supabase, user.id);
    if (result.error) setError(result.error);
    setItems(result.items);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="bg-grid-fade">
      <div className="page-shell max-w-3xl space-y-8 py-8 sm:py-12">
        <div className="space-y-2">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-primary">
            For clients
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            My briefs
          </h1>
          <p className="max-w-lg text-sm text-white/45">
            Briefs you sent while signed in
            {email ? (
              <>
                {" "}
                as <span className="text-white/70">{email}</span>
              </>
            ) : null}
            . Creators reply on WhatsApp if they accept.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No briefs yet"
            body="Send a brief from any creator profile while signed in — it’ll show up here."
            primary={{ label: "Browse creators", href: "/" }}
            secondary={{ label: "Client guide", href: "/guides/clients" }}
          />
        ) : (
          <ul className="space-y-3">
            {items.map((inq) => (
              <li
                key={inq.id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-white">
                      {inq.creator_name}
                    </p>
                    <p className="text-xs text-white/40">
                      {briefTypeLabel(inq.brief_type)} · {inq.category}
                      {inq.location ? ` · ${inq.location}` : ""}
                      {inq.event_date
                        ? ` · ${formatDateIn(inq.event_date)}`
                        : ""}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "capitalize",
                      inq.status === "accepted" &&
                        "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
                      inq.status === "declined" &&
                        "border-destructive/30 bg-destructive/10 text-destructive",
                      inq.status === "pending" &&
                        "border-primary/30 bg-primary/10 text-primary"
                    )}
                    variant="outline"
                  >
                    {inq.status}
                  </Badge>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/50">
                  {inq.message}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/30">
                  <span>
                    Sent {new Date(inq.created_at).toLocaleDateString("en-IN")}
                  </span>
                  <Link
                    href={`/creators/${inq.creator_id}`}
                    className="font-medium text-primary/80 hover:underline"
                  >
                    View profile
                  </Link>
                </div>
                {inq.status === "pending" && (
                  <p className="mt-2 text-xs text-white/40">
                    Watch WhatsApp — if they accept, they&apos;ll message you.
                  </p>
                )}
                {inq.status === "accepted" && (
                  <p className="mt-2 text-xs text-emerald-200/80">
                    Accepted — expect WhatsApp from the creator.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/">Browse creators</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/job-board">Job board</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
