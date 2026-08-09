import type { SupabaseClient } from "@supabase/supabase-js";

export type Review = {
  id: string;
  creator_id: string;
  inquiry_id: string | null;
  client_name: string;
  client_email: string | null;
  rating: number;
  body: string | null;
  is_success_story: boolean;
  success_quote: string | null;
  status: "pending" | "published" | "hidden";
  created_at: string;
};

export function generateReviewToken(): string {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Creator marks accepted job complete → client can leave a review via token URL */
export async function markJobCompleteAndCreateReviewLink(
  supabase: SupabaseClient,
  inquiryId: string
): Promise<{ token?: string; url?: string; error?: string }> {
  const token = generateReviewToken();
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const { data, error } = await supabase
    .from("inquiries")
    .update({
      job_completed_at: new Date().toISOString(),
      review_token: token,
      review_token_expires_at: expires.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", inquiryId)
    .eq("status", "accepted")
    .select("id, review_token")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Only accepted briefs can request a review." };

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://rollr-platform-gig.vercel.app";

  return {
    token,
    url: `${origin.replace(/\/$/, "")}/review/${token}`,
  };
}

export async function fetchInquiryByReviewToken(
  supabase: SupabaseClient,
  token: string
): Promise<{
  inquiry?: {
    id: string;
    creator_id: string;
    creator_name: string;
    client_name: string;
    client_email: string | null;
    category: string;
    location: string;
    review_token_expires_at: string | null;
    job_completed_at: string | null;
  };
  alreadyReviewed?: boolean;
  error?: string;
}> {
  const { data, error } = await supabase
    .from("inquiries")
    .select(
      "id, creator_id, creator_name, client_name, client_email, category, location, review_token_expires_at, job_completed_at"
    )
    .eq("review_token", token)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Invalid or expired review link." };

  if (
    data.review_token_expires_at &&
    new Date(data.review_token_expires_at) < new Date()
  ) {
    return { error: "This review link has expired." };
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("inquiry_id", data.id)
    .maybeSingle();

  return {
    inquiry: data as {
      id: string;
      creator_id: string;
      creator_name: string;
      client_name: string;
      client_email: string | null;
      category: string;
      location: string;
      review_token_expires_at: string | null;
      job_completed_at: string | null;
    },
    alreadyReviewed: Boolean(existing),
  };
}

export async function submitReview(
  supabase: SupabaseClient,
  input: {
    token: string;
    rating: number;
    body?: string;
    is_success_story?: boolean;
    success_quote?: string;
    client_name?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "Rating must be 1–5 stars." };
  }

  const loaded = await fetchInquiryByReviewToken(supabase, input.token);
  if (loaded.error || !loaded.inquiry) {
    return { ok: false, error: loaded.error || "Invalid link" };
  }
  if (loaded.alreadyReviewed) {
    return { ok: false, error: "You already left a review for this job." };
  }

  const { error } = await supabase.from("reviews").insert({
    creator_id: loaded.inquiry.creator_id,
    inquiry_id: loaded.inquiry.id,
    client_name: (input.client_name || loaded.inquiry.client_name).trim(),
    client_email: loaded.inquiry.client_email,
    rating: input.rating,
    body: input.body?.trim() || null,
    is_success_story: Boolean(input.is_success_story),
    success_quote: input.success_quote?.trim() || null,
    status: "published",
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchPublishedReviews(
  supabase: SupabaseClient,
  creatorId: string,
  limit = 20
): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Review[];
}

export async function fetchSuccessStories(
  supabase: SupabaseClient,
  creatorId: string,
  limit = 5
): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .eq("is_success_story", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Review[];
}
