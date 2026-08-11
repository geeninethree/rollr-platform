"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  FileText,
  Loader2,
  Lock,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  canPostAnotherOpenJob,
  closeJob,
  createJob,
  createPitch,
  creatorToPosterWhatsAppUrl,
  fetchMyJobs,
  fetchOpenJobs,
  fetchPitchesForJob,
  fetchPosterContactForAcceptedPitch,
  setPitchStatus,
  type Job,
  type JobPitch,
} from "@/lib/jobs";
import { LOCATIONS, SHOOT_CATEGORIES } from "@/lib/mock-data";
import { claimRecruiterPath } from "@/lib/roles";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BriefType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function JobBoardPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [role, setRole] = useState<string>("client");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPost, setShowPost] = useState(false);
  const [gateMsg, setGateMsg] = useState<string | null>(null);
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [recruiterPending, setRecruiterPending] = useState(false);
  const [claimingRecruiter, setClaimingRecruiter] = useState(false);

  // post form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [briefType, setBriefType] = useState<BriefType>("shoot");
  const [location, setLocation] = useState("Bandra / Khar");
  const [category, setCategory] = useState("Wedding");
  const [eventDate, setEventDate] = useState("");
  const [budget, setBudget] = useState("");
  const [posterName, setPosterName] = useState("");
  const [posterWhatsapp, setPosterWhatsapp] = useState("");
  const [posting, setPosting] = useState(false);

  // pitch
  const [pitchJobId, setPitchJobId] = useState<string | null>(null);
  const [pitchMsg, setPitchMsg] = useState("");
  const [pitching, setPitching] = useState(false);

  // manage pitches on my jobs
  const [pitchesByJob, setPitchesByJob] = useState<Record<string, JobPitch[]>>(
    {}
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);
    setUserEmail(auth.user?.email || "");

    if (uid) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, recruiter_sub_status, email")
        .eq("id", uid)
        .maybeSingle();
      setUserName(profile?.full_name || auth.user?.email?.split("@")[0] || "");
      setPosterName(profile?.full_name || "");
      if (profile?.email) setUserEmail(profile.email);
      const r = profile?.role || "client";
      setRole(r);
      const multiActive =
        r === "recruiter" && profile?.recruiter_sub_status === "active";
      setIsRecruiter(multiActive);
      setRecruiterPending(
        r === "recruiter" && profile?.recruiter_sub_status !== "active"
      );

      const mine = await fetchMyJobs(supabase, uid);
      setMyJobs(mine.jobs);
      if (mine.error) setError(mine.error);

      const gate = await canPostAnotherOpenJob(supabase, uid);
      setGateMsg(gate.ok ? null : gate.reason || null);

      // pitches for my open jobs
      const map: Record<string, JobPitch[]> = {};
      for (const j of mine.jobs.filter((x) => x.status === "open")) {
        const p = await fetchPitchesForJob(supabase, j.id);
        map[j.id] = p.pitches;
      }
      setPitchesByJob(map);
    } else {
      setMyJobs([]);
      setGateMsg(null);
      setIsRecruiter(false);
      setRecruiterPending(false);
    }

    const open = await fetchOpenJobs(supabase);
    setJobs(open.jobs);
    if (open.error) setError(open.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = new URLSearchParams(window.location.search).get("recruiter");
    if (flag === "waitlisted") {
      setInfo(
        "Recruiter path set. You’re on the multi-job waitlist — you can still post 1 free open job now."
      );
    }
  }, []);

  async function claimMultiJobWaitlist() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;
    setClaimingRecruiter(true);
    setError(null);
    const result = await claimRecruiterPath(supabase, userId, {
      full_name: userName,
      notes: "One-click from job board",
    });
    setClaimingRecruiter(false);
    if (!result.ok) {
      setError(result.error || "Could not join recruiter waitlist");
      return;
    }
    setInfo(
      result.waitlisted
        ? "You’re on the multi-job waitlist. Admin can activate when ready — 1 free open job works now."
        : result.error ||
            "Recruiter role updated. Multi-job is active or already requested."
    );
    await load();
  }

  async function onPost(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;
    setPosting(true);
    setError(null);
    const result = await createJob(supabase, userId, {
      title,
      description,
      brief_type: briefType,
      location,
      category,
      event_date: eventDate,
      budget,
      poster_name: posterName || userName,
      poster_whatsapp: posterWhatsapp,
      poster_email: userEmail || undefined,
    });
    setPosting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowPost(false);
    setTitle("");
    setDescription("");
    setPosterWhatsapp("");
    await load();
  }

  async function onCloseJob(id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const result = await closeJob(supabase, id, "closed");
    if (!result.ok) {
      setError(result.error || "Could not close job.");
      return;
    }
    setInfo("Job closed.");
    await load();
  }

  async function onPitch(jobId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !userId) return;
    setPitching(true);
    setError(null);
    const result = await createPitch(supabase, {
      job_id: jobId,
      creator_user_id: userId,
      creator_name: userName || "Creator",
      message: pitchMsg,
    });
    setPitching(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPitchJobId(null);
    setPitchMsg("");
    setInfo("Pitch sent. If the poster accepts, you can WhatsApp them from Accepted pitches below.");
    await load();
  }

  async function onAcceptPitch(pitch: JobPitch) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    // Poster accepts — creator will open WA (same as brief model: service side messages hire side)
    // Actually brief: creator accepts and WA to client. Here poster accepts pitch; creator should WA poster.
    // So we just set status accepted; creator pulls contact.
    const result = await setPitchStatus(supabase, pitch.id, "accepted");
    if (result.error) {
      setError(result.error);
      return;
    }
    await load();
  }

  async function onCreatorOpenWa(pitchId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const contact = await fetchPosterContactForAcceptedPitch(supabase, pitchId);
    if (contact.error || !contact.poster_whatsapp) {
      setError(contact.error || "Contact not available yet.");
      return;
    }
    const url = creatorToPosterWhatsAppUrl({
      posterWhatsapp: contact.poster_whatsapp,
      posterName: contact.poster_name || "there",
      creatorName: userName || "Creator",
      jobTitle: contact.job_title || "your job",
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="bg-grid-fade">
      <div className="page-shell space-y-8 py-8 sm:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Open calls
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Job board</h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Post a shoot or edit job. Creators pitch; you accept;{" "}
              <strong className="text-foreground">they</strong> WhatsApp you
              (same privacy model as Send brief). Free:{" "}
              <strong className="text-foreground">1 open job</strong> at a time.
              Multiple open jobs → Recruiter · ₹399/mo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!userId ? (
              <Button asChild className="font-semibold">
                <Link href="/signup?next=/job-board">Sign up to post a job</Link>
              </Button>
            ) : (
              <Button
                type="button"
                className="font-semibold"
                disabled={Boolean(gateMsg) && !isRecruiter}
                onClick={() => setShowPost((v) => !v)}
              >
                <Briefcase className="h-4 w-4" />
                {showPost ? "Cancel" : "Post a job"}
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/">Browse creators</Link>
            </Button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </p>
        )}

        {info && (
          <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
            {info}
          </p>
        )}

        {userId && gateMsg && !isRecruiter && (
          <div className="rounded-2xl border border-primary/25 bg-primary/10 px-5 py-4 text-sm">
            <p className="font-medium text-foreground">{gateMsg}</p>
            <p className="mt-1 text-muted-foreground">
              Close your open job below, or{" "}
              <a
                href="#recruiter"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                join Recruiter waitlist · ₹399/mo
              </a>{" "}
              for multiple open posts.
            </p>
          </div>
        )}

        {isRecruiter && (
          <p className="text-xs text-primary">
            Recruiter active — multiple open jobs allowed.
          </p>
        )}

        {userId && recruiterPending && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm">
            <p className="font-medium text-foreground">
              Recruiter · multi-job pending
            </p>
            <p className="mt-1 text-muted-foreground">
              Your role is recruiter and you&apos;re on the waitlist. Free tier
              still applies: <strong className="text-foreground">1 open job</strong>{" "}
              at a time until we activate multi-job (₹399/mo).
            </p>
          </div>
        )}

        {userId && role !== "recruiter" && !isRecruiter && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/60 px-5 py-3 text-sm">
            <p className="text-muted-foreground">
              Agency or frequent hires? Unlock multiple open jobs.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={claimingRecruiter}
              onClick={() => void claimMultiJobWaitlist()}
            >
              {claimingRecruiter
                ? "Saving…"
                : "Join multi-job waitlist (set recruiter)"}
            </Button>
          </div>
        )}

        {/* Post form */}
        {userId && showPost && (
          <Card className="border-border bg-card/90">
            <CardHeader>
              <CardTitle className="text-lg">Post a job</CardTitle>
              <p className="text-sm text-muted-foreground">
                Requires an account. Your WhatsApp stays private until you accept
                a creator&apos;s pitch — then they message you.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => void onPost(e)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Title</label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Wedding coverage — Bandra, Dec"
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Scope, hours, deliverables…"
                    className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Type</label>
                    <select
                      value={briefType}
                      onChange={(e) =>
                        setBriefType(e.target.value as BriefType)
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 text-sm"
                    >
                      <option value="shoot">Shoot only</option>
                      <option value="edit">Edit only</option>
                      <option value="full_package">Shoot + edit</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 text-sm"
                    >
                      {SHOOT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Area</label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 text-sm"
                    >
                      {LOCATIONS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Event date
                    </label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Budget (optional)
                    </label>
                    <Input
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. ₹40–60k"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Your name
                    </label>
                    <Input
                      required
                      value={posterName}
                      onChange={(e) => setPosterName(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs text-muted-foreground">
                      Your WhatsApp (private until you accept a pitch)
                    </label>
                    <Input
                      required
                      value={posterWhatsapp}
                      onChange={(e) => setPosterWhatsapp(e.target.value)}
                      placeholder="+91 …"
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="font-semibold"
                  disabled={posting}
                >
                  {posting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Publish job
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* My jobs (poster) */}
        {userId && myJobs.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Your jobs</h2>
            <ul className="space-y-3">
              {myJobs.map((j) => (
                <li key={j.id}>
                  <Card className="border-border bg-card/80">
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <CardTitle className="text-base">{j.title}</CardTitle>
                        <Badge
                          className={cn(
                            "capitalize",
                            j.status === "open"
                              ? "bg-primary/20 text-primary"
                              : "bg-secondary text-muted-foreground"
                          )}
                        >
                          {j.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {j.category} · {j.location}
                        {j.event_date ? ` · ${j.event_date}` : ""}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">{j.description}</p>
                      {(pitchesByJob[j.id] || []).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-foreground">
                            Pitches
                          </p>
                          {(pitchesByJob[j.id] || []).map((p) => (
                            <div
                              key={p.id}
                              className="rounded-lg border border-border px-3 py-2"
                            >
                              <p className="font-medium">{p.creator_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {p.message}
                              </p>
                              <p className="mt-1 text-[10px] uppercase text-muted-foreground">
                                {p.status}
                              </p>
                              {p.status === "pending" && j.status === "open" && (
                                <div className="mt-2 flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => void onAcceptPitch(p)}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      void setPitchStatus(
                                        getSupabaseBrowserClient()!,
                                        p.id,
                                        "declined"
                                      ).then(() => load())
                                    }
                                  >
                                    Decline
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    {j.status === "open" && (
                      <CardFooter>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void onCloseJob(j.id)}
                        >
                          Close job
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Open board */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Open jobs{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({jobs.length})
            </span>
          </h2>

          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </p>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-4 font-medium">No open jobs yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Be the first to post. Sign up as a client, publish one free open
                job, and let creators pitch.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {jobs.map((j) => (
                <li key={j.id}>
                  <Card className="h-full border-border bg-card/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{j.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {j.brief_type.replace("_", " ")} · {j.category} ·{" "}
                        {j.location}
                        {j.event_date ? ` · ${j.event_date}` : ""}
                        {j.budget ? ` · ${j.budget}` : ""}
                      </p>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <p className="line-clamp-4">{j.description}</p>
                      <p className="mt-2 flex items-center gap-1 text-[11px]">
                        <Lock className="h-3 w-3 text-primary" />
                        Posted by {j.poster_name} · contact protected
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2">
                      {!userId ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/login?next=/job-board">
                            Sign in to pitch
                          </Link>
                        </Button>
                      ) : j.poster_id === userId ? (
                        <span className="text-xs text-muted-foreground">
                          Your post
                        </span>
                      ) : role === "creator" ? (
                        pitchJobId === j.id ? (
                          <div className="w-full space-y-2">
                            <textarea
                              rows={3}
                              value={pitchMsg}
                              onChange={(e) => setPitchMsg(e.target.value)}
                              placeholder="Short pitch — why you're a fit"
                              className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={pitching || !pitchMsg.trim()}
                                onClick={() => void onPitch(j.id)}
                              >
                                Send pitch
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPitchJobId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPitchJobId(j.id)}
                          >
                            Pitch this job
                          </Button>
                        )
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Pitching is for creators.{" "}
                          <Link
                            href="/signup?role=creator&next=/studio"
                            className="font-medium text-primary hover:underline"
                          >
                            Switch to creator
                          </Link>{" "}
                          (builds portfolio · ₹299 listing).
                        </p>
                      )}
                    </CardFooter>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Creator: accepted pitches → open WA */}
        {userId && role === "creator" && (
          <AcceptedPitchesPanel
            userId={userId}
            onOpenWa={(id) => void onCreatorOpenWa(id)}
          />
        )}

        <RecruiterWaitlistSection
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          isRecruiterActive={isRecruiter}
          recruiterPending={recruiterPending}
          onClaimLoggedIn={() => void claimMultiJobWaitlist()}
          claiming={claimingRecruiter}
        />
      </div>
    </div>
  );
}

function RecruiterWaitlistSection({
  userId,
  userName,
  userEmail,
  isRecruiterActive,
  recruiterPending,
  onClaimLoggedIn,
  claiming,
}: {
  userId: string | null;
  userName: string;
  userEmail: string;
  isRecruiterActive: boolean;
  recruiterPending: boolean;
  onClaimLoggedIn: () => void;
  claiming: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (userName) setName(userName);
    if (userEmail) setEmail(userEmail);
  }, [userName, userEmail]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setErr("Supabase not configured");
        return;
      }

      // Logged-in: set role + waitlist in one path
      if (userId) {
        const result = await claimRecruiterPath(supabase, userId, {
          full_name: name || userName,
          notes: notes || "Recruiter waitlist form (signed in)",
        });
        if (!result.ok) {
          setErr(result.error || "Could not save");
          return;
        }
        setDone(true);
        onClaimLoggedIn();
        return;
      }

      const { submitWaitlist } = await import("@/lib/waitlist");
      const result = await submitWaitlist(supabase, {
        full_name: name,
        email,
        phone,
        role: "recruiter",
        primary_category: "Multi-job board",
        notes: notes || "Interested in Recruiter · ₹399/mo multi-job",
      });
      if (!result.ok) {
        setErr(result.error || "Could not save");
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (isRecruiterActive) {
    return (
      <section
        id="recruiter"
        className="scroll-mt-24 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-6"
      >
        <h2 className="text-base font-semibold">Recruiter · active</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Multi-job is on for this account. Post as many open jobs as you need.
        </p>
      </section>
    );
  }

  return (
    <section
      id="recruiter"
      className="scroll-mt-24 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-6"
    >
      <h2 className="text-base font-semibold">Recruiter · ₹399/mo</h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        Free accounts: <strong className="text-foreground">1 open job</strong>{" "}
        at a time (close it to post another). Recruiter unlocks multiple open
        jobs. Billing is not live — join the waitlist and we&apos;ll activate
        multi-job when ready. Anyone signed in can still post one free job now.
      </p>

      {recruiterPending && (
        <p className="mt-3 text-sm text-primary">
          You already have recruiter role + waitlist pending. Post 1 free job
          above while you wait.
        </p>
      )}

      {done ? (
        <p className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
          You&apos;re on the recruiter waitlist
          {email ? (
            <>
              {" "}
              at <strong>{email}</strong>
            </>
          ) : null}
          . Saved for the team — no auto-confirm email yet. Meanwhile, post one
          free open job anytime.
        </p>
      ) : userId && !recruiterPending ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={claiming}
            onClick={() => onClaimLoggedIn()}
          >
            {claiming
              ? "Saving…"
              : "Join multi-job waitlist (this account)"}
          </Button>
          <Button asChild type="button" variant="outline" size="sm">
            <Link href="/signup?role=recruiter&next=/job-board">
              Or open recruiter signup
            </Link>
          </Button>
        </div>
      ) : !userId ? (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="mt-4 grid max-w-xl gap-3 sm:grid-cols-2"
        >
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="bg-background/50"
          />
          <Input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Work email"
            className="bg-background/50"
          />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="WhatsApp (optional)"
            className="bg-background/50"
          />
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Agency / volume (optional)"
            className="bg-background/50"
          />
          {err && (
            <p className="text-xs text-destructive sm:col-span-2">{err}</p>
          )}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving…" : "Join recruiter waitlist"}
            </Button>
            <Button asChild type="button" variant="outline" size="sm">
              <Link href="/signup?role=recruiter&next=/job-board">
                Or create recruiter account
              </Link>
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function AcceptedPitchesPanel({
  userId,
  onOpenWa,
}: {
  userId: string;
  onOpenWa: (pitchId: string) => void;
}) {
  const [pitches, setPitches] = useState<JobPitch[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void (async () => {
      const { data } = await supabase
        .from("job_pitches")
        .select("*")
        .eq("creator_user_id", userId)
        .eq("status", "accepted")
        .order("updated_at", { ascending: false });
      setPitches((data || []) as JobPitch[]);
    })();
  }, [userId]);

  if (pitches.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Accepted pitches</h2>
      <p className="text-sm text-muted-foreground">
        Poster accepted you — open WhatsApp to them (same as brief accept).
      </p>
      <ul className="space-y-2">
        {pitches.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
          >
            <span className="text-sm">{p.creator_name} · pitch accepted</span>
            <Button size="sm" onClick={() => onOpenWa(p.id)}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp poster
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
