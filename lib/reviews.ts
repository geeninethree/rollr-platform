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
    for (let i = 0; i < bytes.length; i++)
      bytes[i] = Math.floor(Math.random() * 256);
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
      : process.env.NEXT_PUBLIC_SITE_URL ||
        "https://rollrgigs.vercel.app";

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
    category: string;
    location: string;
    review_token_expires_at: string | null;
    job_completed_at: string | null;
  };
  alreadyReviewed?: boolean;
  error?: string;
}> {
  const { data, error } = await supabase.rpc("get_inquiry_for_review_token", {
    p_token: token.trim(),
  });

  if (error) {
    const msg = error.message || "Could not load review link";
    if (
      msg.includes("get_inquiry_for_review_token") ||
      msg.includes("does not exist")
    ) {
      console.warn("[rollr] review token load:", msg);
      return { error: "This review link isn’t available right now." };
    }
    return { error: msg.length > 120 ? "Couldn’t open this review link." : msg };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: "Invalid or expired review link." };

  return {
    inquiry: {
      id: String(row.id),
      creator_id: String(row.creator_id),
      creator_name: String(row.creator_name || ""),
      client_name: String(row.client_name || ""),
      category: String(row.category || ""),
      location: String(row.location || ""),
      review_token_expires_at: (row.review_token_expires_at as string) || null,
      job_completed_at: (row.job_completed_at as string) || null,
    },
    alreadyReviewed: Boolean(row.already_reviewed),
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

  const { error } = await supabase.rpc("submit_review_with_token", {
    p_token: input.token.trim(),
    p_rating: input.rating,
    p_body: input.body?.trim() || null,
    p_is_success_story: Boolean(input.is_success_story),
    p_success_quote: input.success_quote?.trim() || null,
    p_client_name: input.client_name?.trim() || null,
  });

  if (error) {
    const msg = error.message || "Could not save review";
    if (msg.includes("INVALID_TOKEN")) {
      return { ok: false, error: "Invalid or expired review link." };
    }
    if (msg.includes("TOKEN_EXPIRED")) {
      return { ok: false, error: "This review link has expired." };
    }
    if (msg.includes("ALREADY_REVIEWED")) {
      return { ok: false, error: "You already left a review for this job." };
    }
    if (msg.includes("INVALID_RATING")) {
      return { ok: false, error: "Rating must be 1–5 stars." };
    }
    if (
      msg.includes("submit_review_with_token") ||
      msg.includes("does not exist")
    ) {
      console.warn("[rollr] review submit:", msg);
      return {
        ok: false,
        error: "Couldn’t submit your review right now. Please try again later.",
      };
    }
    return {
      ok: false,
      error: msg.length > 120 ? "Couldn’t submit review. Try again." : msg,
    };
  }

  return { ok: true };
}

export async function fetchPublishedReviews(
  supabase: SupabaseClient,
  creatorId: string,
  limit = 20
): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, creator_id, inquiry_id, client_name, rating, body, is_success_story, success_quote, status, created_at"
    )
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
    .select(
      "id, creator_id, inquiry_id, client_name, rating, body, is_success_story, success_quote, status, created_at"
    )
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .eq("is_success_story", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Review[];
}
