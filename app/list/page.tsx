"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  Clapperboard,
  LayoutGrid,
  MessageSquare,
  Percent,
  Shield,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const included = [
  {
    icon: Percent,
    title: "0% commission on bookings",
    body: "You invoice the client directly. ROLLR never takes a cut of the job.",
  },
  {
    icon: Sparkles,
    title: "Unlimited client briefs",
    body: "No lead caps. Accept as many qualified requests as you can handle.",
  },
  {
    icon: LayoutGrid,
    title: "Shoot + edit on one profile",
    body: "List as photographer, editor, or both — hybrids show in both directories.",
  },
  {
    icon: MessageSquare,
    title: "Protected contact",
    body: "Your number stays private. You open WhatsApp to the client only after you accept their brief.",
  },
  {
    icon: Shield,
    title: "Qualified leads, not spam",
    body: "Clients send a real brief (date, budget, scope) before you engage.",
  },
  {
    icon: BadgeCheck,
    title: "Your portfolio, your rates",
    body: "Category package pricing, areas, and work samples — clients see the real you.",
  },
];

const comparison = [
  { feature: "Monthly price", rollr: "₹299", typical: "15–30% of each job" },
  { feature: "Commission on bookings", rollr: "0%", typical: "High" },
  { feature: "Client briefs", rollr: "Unlimited", typical: "Often capped or pay-per-lead" },
  { feature: "Contact control", rollr: "You accept first", typical: "Number often public" },
  { feature: "Shoot + edit listing", rollr: "Same profile", typical: "Separate or messy" },
];

export default function ListProfilePage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"shoot" | "edit" | "both">("both");
  const [category, setCategory] = useState("Wedding");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const { getSupabaseBrowserClient } = await import(
        "@/lib/supabase/client"
      );
      const { submitWaitlist } = await import("@/lib/waitlist");
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setFormError(
          "Supabase is not configured. Contact the ROLLR team or try again later."
        );
        return;
      }
      const result = await submitWaitlist(supabase, {
        full_name: name,
        email,
        phone,
        role,
        primary_category: category,
      });
      if (!result.ok) {
        setFormError(result.error || "Could not save. Try again.");
        return;
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-grid-fade">
      {/* Hero pricing */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
              For creators
            </Badge>
            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Unlimited briefs. Zero commission.{" "}
              <span className="text-primary">₹299/mo.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Built for Mumbai photographers, videographers, and editors who want
              direct clients — not marketplace tax.
            </p>

            <div className="mx-auto mt-8 max-w-sm rounded-2xl border-2 border-primary/40 bg-card p-6 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.4)]">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Creator membership
              </p>
              <p className="mt-2 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-semibold tracking-tight text-primary">
                  ₹299
                </span>
                <span className="text-muted-foreground">/month</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Cancel anytime · No booking fees · Unlimited briefs
              </p>
              <Button
                asChild
                size="lg"
                className="mt-5 w-full font-semibold shadow-md shadow-primary/20"
              >
                <a href="#join">Register interest</a>
              </Button>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Payments not live yet — no charge today. We&apos;ll contact early
                creators when billing opens.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-primary" /> Photographers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clapperboard className="h-3.5 w-3.5 text-primary" /> Editors
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Hybrids
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-8 max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight">
            What you get for ₹299
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you need to show up, get briefs, and close jobs on your own
            terms.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {included.map((item) => (
            <li
              key={item.title}
              className="rounded-xl border border-border bg-card/70 p-5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-semibold">{item.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Portfolio & vetting */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Portfolio requirements
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Clients need proof of work. Links help — on-platform samples are
                required to go live.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {[
                  "Min 3 portfolio pieces hosted on ROLLR (featured set powers your card)",
                  "Avatar + cover + bio (40+ characters)",
                  "Areas and categories filled in",
                  "If you offer shoot: coverage samples · if edit: post samples",
                  "Optional: website, Instagram, showreel links",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 font-semibold">
                <Link href="/studio">Open portfolio builder</Link>
              </Button>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                How we vet listings
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Stops empty profiles and random image spam before Discover.
              </p>
              <ol className="mt-6 space-y-4">
                {[
                  {
                    t: "Auto quality score",
                    d: "Required fields, min works, shoot/edit samples if claimed.",
                  },
                  {
                    t: "Submit for review",
                    d: "Draft → Pending review when checks pass (portfolio builder).",
                  },
                  {
                    t: "Human approve (live product)",
                    d: "Reviewer checks real event/edit work vs stock/spam — then Published.",
                  },
                  {
                    t: "External links never enough alone",
                    d: "IG/site optional for trust; cards always use on-ROLLR featured work.",
                  },
                ].map((s, i) => (
                  <li key={s.t} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{s.t}</p>
                      <p className="text-sm text-muted-foreground">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-y border-border/60 bg-card/20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Why not a marketplace cut?
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Flat listing fee beats giving away a third of every wedding or gig.
          </p>
          <div className="mt-8 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-border bg-card">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Feature
                  </th>
                  <th className="px-4 py-3 font-semibold text-primary">ROLLR</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Typical marketplace
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.feature}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        {row.rollr}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <X className="h-3.5 w-3.5 opacity-50" />
                        {row.typical}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How creators work on ROLLR */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          How it works for you
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "1",
              t: "List your profile",
              d: "Photo, rates, areas, and whether you shoot, edit, or both.",
            },
            {
              n: "2",
              t: "Receive briefs",
              d: "Clients send date, budget, and scope. You choose what to accept.",
            },
            {
              n: "3",
              t: "You message them",
              d: "On accept, open WhatsApp to the client. Negotiate and book off-platform.",
            },
          ].map((s) => (
            <li
              key={s.n}
              className="rounded-xl border border-border bg-card/60 p-5"
            >
              <span className="text-xs font-semibold text-primary">Step {s.n}</span>
              <p className="mt-2 font-semibold">{s.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Recruiter multi-job — job board product, not creator listing */}
      <section
        id="recruiter"
        className="border-t border-border/60 scroll-mt-20 bg-primary/5"
      >
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                Hiring side
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Recruiter · multi-job board · ₹399/mo
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Creators list here for ₹299. Agencies and frequent hires post
                open jobs on the{" "}
                <Link
                  href="/job-board"
                  className="font-medium text-primary hover:underline"
                >
                  job board
                </Link>
                : free = 1 open job; Recruiter unlocks multiple. Billing not
                live — join the waitlist from the board.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="font-semibold">
                <Link href="/job-board#recruiter">
                  Join recruiter waitlist
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/signup?role=recruiter&next=/job-board">
                  Sign up as recruiter
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist form */}
      <section id="join" className="border-t border-border/60 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                Register interest
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                No payment system yet. This form saves your details to our
                waitlist so the ROLLR team can review and invite you. No charge
                today. Ready now? You can also sign up and publish a portfolio
                directly (alpha).
              </p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">1.</strong> Register
                  interest (this form) — we get your email/WhatsApp
                </li>
                <li>
                  <strong className="text-foreground">2.</strong> We mark you
                  approved and send the signup link
                </li>
                <li>
                  <strong className="text-foreground">3.</strong> Or skip ahead:{" "}
                  <Link
                    href="/signup?role=creator&next=/studio"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign up → Portfolio → Publish
                  </Link>{" "}
                  to go live on the directory
                </li>
              </ol>
              <Button asChild variant="outline" size="sm">
                <Link href="/guides/creators">Creator guide →</Link>
              </Button>
            </div>

            <Card className="border-primary/25 bg-card shadow-lg shadow-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">
                  {submitted ? "You're on the waitlist" : "Creator interest"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {submitted
                    ? "Saved for the ROLLR team. We review in admin — no auto-email to you yet."
                    : "Tell us who you are — takes under a minute. No charge today."}
                </p>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                    <p className="text-sm font-medium">
                      Thanks, {name.split(" ")[0] || "there"}.
                    </p>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Saved for review
                      {email ? ` · ${email}` : ""}. We don&apos;t send an
                      auto-confirm email yet — check admin or build your
                      portfolio while you wait.
                    </p>
                    <Button asChild variant="outline" className="mt-2">
                      <Link href="/signup?role=creator&next=/studio">
                        Sign up as creator
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        I am a…
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            ["shoot", "Photographer"],
                            ["edit", "Editor"],
                            ["both", "Both"],
                          ] as const
                        ).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setRole(value)}
                            className={cn(
                              "rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                              role === value
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="name"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Full name
                      </label>
                      <Input
                        id="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="email"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@studio.com"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="phone"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        WhatsApp
                      </label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 …"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="category"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Primary work
                      </label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {[
                          "Wedding",
                          "Nightclub",
                          "Corporate",
                          "Fashion",
                          "Real Estate",
                          "Concert",
                          "Product",
                          "Colour / post",
                          "Reels editing",
                        ].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formError && (
                      <p
                        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                        role="alert"
                      >
                        {formError}
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="w-full font-semibold"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Saving…"
                        : "Register interest — ₹299/mo"}
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground">
                      No payment taken. By submitting you agree to our{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
