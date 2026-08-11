import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listingStatusEmail, sendEmail } from "@/lib/email";

type Body = {
  listing_id: string;
  status: "published" | "rejected" | "draft";
};

/**
 * POST after admin sets listing status — emails the creator (Resend if configured).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.listing_id || !body.status) {
      return NextResponse.json(
        { ok: false, error: "listing_id and status required" },
        { status: 400 }
      );
    }
    if (!["published", "rejected", "draft"].includes(body.status)) {
      return NextResponse.json(
        { ok: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return NextResponse.json(
        { ok: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, key);

    // Reuse notify RPC pattern: get email by creator listing id
    const { data: emailRpc, error: rpcError } = await supabase.rpc(
      "creator_notify_email",
      { p_creator_id: body.listing_id }
    );

    if (rpcError) {
      return NextResponse.json({
        ok: false,
        error: `${rpcError.message} — run migration 00008`,
      });
    }

    const to = (emailRpc as string | null) || null;
    if (!to) {
      return NextResponse.json({
        ok: false,
        error: "Creator email not found",
      });
    }

    // Name for email (best-effort; public published only may fail for pending — use RPC path only for email)
    let creatorName = "there";
    const { data: listing } = await supabase
      .from("creator_profiles")
      .select("id, profiles(full_name)")
      .eq("id", body.listing_id)
      .maybeSingle();

    const prof = listing?.profiles as
      | { full_name?: string }
      | { full_name?: string }[]
      | null;
    if (prof && !Array.isArray(prof) && prof.full_name) {
      creatorName = prof.full_name;
    } else if (Array.isArray(prof) && prof[0]?.full_name) {
      creatorName = prof[0].full_name;
    }

    const site =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "https://rollrgigs.vercel.app";

    const mail = listingStatusEmail({
      creatorName,
      status: body.status,
      profileUrl:
        body.status === "published"
          ? `${site}/creators/${body.listing_id}`
          : undefined,
      studioUrl: `${site}/studio`,
    });

    const result = await sendEmail({
      to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Listing notify failed",
      },
      { status: 500 }
    );
  }
}
