import type { SupabaseClient } from "@supabase/supabase-js";
import type { BriefType } from "@/lib/types";

export type JobStatus = "open" | "closed" | "filled";
export type PitchStatus = "pending" | "accepted" | "declined";

export type Job = {
  id: string;
  poster_id: string;
  title: string;
  description: string;
  brief_type: BriefType;
  location: string;
  category: string;
  event_date: string;
  budget?: string | null;
  poster_name: string;
  poster_whatsapp?: string; // only when you're poster or after accept path
  poster_email?: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
};

export type JobPitch = {
  id: string;
  job_id: string;
  creator_user_id: string;
  creator_name: string;
  message: string;
  status: PitchStatus;
  created_at: string;
};

export type PostJobInput = {
  title: string;
  description: string;
  brief_type: BriefType;
  location: string;
  category: string;
  event_date?: string;
  budget?: string;
  poster_name: string;
  poster_whatsapp: string;
  poster_email?: string;
};

export async function fetchOpenJobs(
  supabase: SupabaseClient
): Promise<{ jobs: Job[]; error?: string }> {
  // Prefer privacy view (no poster_whatsapp). Falls back if 00012 not applied.
  const viaView = await supabase
    .from("open_jobs_board")
    .select(
      "id, poster_id, title, description, brief_type, location, category, event_date, budget, poster_name, status, created_at, updated_at, closed_at"
    )
    .order("created_at", { ascending: false });

  if (!viaView.error) {
    return { jobs: (viaView.data || []) as Job[] };
  }

  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, poster_id, title, description, brief_type, location, category, event_date, budget, poster_name, status, created_at, updated_at, closed_at"
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    const msg = viaView.error.message || error.message;
    if (msg.includes("open_jobs_board") || msg.includes("does not exist")) {
      return {
        jobs: [],
        error: `${error.message} — run migration 00012_jobs_public_privacy.sql (and 00009)`,
      };
    }
    return { jobs: [], error: error.message };
  }
  return { jobs: (data || []) as Job[] };
}

export async function fetchMyJobs(
  supabase: SupabaseClient,
  userId: string
): Promise<{ jobs: Job[]; error?: string }> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("poster_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { jobs: [], error: error.message };
  return { jobs: (data || []) as Job[] };
}

export async function canPostAnotherOpenJob(
  supabase: SupabaseClient,
  userId: string
): Promise<{ ok: boolean; reason?: string; isRecruiter?: boolean }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, recruiter_sub_status")
    .eq("id", userId)
    .maybeSingle();

  const isRecruiter =
    profile?.role === "recruiter" &&
    profile?.recruiter_sub_status === "active";

  if (isRecruiter) return { ok: true, isRecruiter: true };

  const { count, error } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("poster_id", userId)
    .eq("status", "open");

  if (error) return { ok: false, reason: error.message };
  if ((count ?? 0) >= 1) {
    return {
      ok: false,
      isRecruiter: false,
      reason:
        "You already have an open job. Close it to post another, or upgrade to Recruiter (₹399/mo) for multiple open posts.",
    };
  }
  return { ok: true, isRecruiter: false };
}

export async function createJob(
  supabase: SupabaseClient,
  userId: string,
  input: PostJobInput
): Promise<{ job?: Job; error?: string }> {
  const gate = await canPostAnotherOpenJob(supabase, userId);
  if (!gate.ok) return { error: gate.reason };

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      poster_id: userId,
      title: input.title.trim(),
      description: input.description.trim(),
      brief_type: input.brief_type,
      location: input.location.trim(),
      category: input.category.trim(),
      event_date: input.event_date?.trim() || "",
      budget: input.budget?.trim() || null,
      poster_name: input.poster_name.trim(),
      poster_whatsapp: input.poster_whatsapp.trim(),
      poster_email: input.poster_email?.trim() || null,
      status: "open",
    })
    .select("*")
    .single();

  if (error) {
    const msg = error.message || "Could not post job";
    if (msg.includes("FREE_JOB_LIMIT")) {
      return {
        error:
          "Close your open job first, or upgrade to Recruiter (₹399/mo) for multiple open posts.",
      };
    }
    if (msg.includes("relation") || msg.includes("does not exist")) {
      return {
        error: `${msg} — run supabase/migrations/00009_jobs_and_recruiter.sql`,
      };
    }
    return { error: msg };
  }
  return { job: data as Job };
}

export async function closeJob(
  supabase: SupabaseClient,
  jobId: string,
  status: "closed" | "filled" = "closed"
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("jobs")
    .update({
      status,
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function createPitch(
  supabase: SupabaseClient,
  input: {
    job_id: string;
    creator_user_id: string;
    creator_name: string;
    message: string;
  }
): Promise<{ pitch?: JobPitch; error?: string }> {
  const { data, error } = await supabase
    .from("job_pitches")
    .insert({
      job_id: input.job_id,
      creator_user_id: input.creator_user_id,
      creator_name: input.creator_name.trim(),
      message: input.message.trim(),
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return { error: "You already pitched this job." };
    }
    return { error: error.message };
  }
  return { pitch: data as JobPitch };
}

export async function fetchPitchesForJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<{ pitches: JobPitch[]; error?: string }> {
  const { data, error } = await supabase
    .from("job_pitches")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) return { pitches: [], error: error.message };
  return { pitches: (data || []) as JobPitch[] };
}

export async function setPitchStatus(
  supabase: SupabaseClient,
  pitchId: string,
  status: "accepted" | "declined"
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("job_pitches")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", pitchId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** After poster accepts pitch: creator loads poster WhatsApp and opens WA (same as brief). */
export async function fetchPosterContactForAcceptedPitch(
  supabase: SupabaseClient,
  pitchId: string
): Promise<{
  poster_whatsapp?: string;
  poster_name?: string;
  job_title?: string;
  error?: string;
}> {
  const { data, error } = await supabase.rpc(
    "job_poster_contact_after_accept",
    { p_pitch_id: pitchId }
  );

  if (error) return { error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: "Contact available only after the poster accepts." };
  return {
    poster_whatsapp: row.poster_whatsapp as string,
    poster_name: row.poster_name as string,
    job_title: row.job_title as string,
  };
}

export function creatorToPosterWhatsAppUrl(input: {
  posterWhatsapp: string;
  posterName: string;
  creatorName: string;
  jobTitle: string;
}) {
  let digits = input.posterWhatsapp.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.startsWith("0") && digits.length === 11) {
    digits = `91${digits.slice(1)}`;
  }
  const text = [
    `Hi ${input.posterName},`,
    `This is ${input.creatorName} on ROLLR.`,
    `You accepted my pitch on “${input.jobTitle}”.`,
    `Happy to discuss scope, timing, and deliverables here.`,
  ].join(" ");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
