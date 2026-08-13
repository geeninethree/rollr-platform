import { NextResponse } from "next/server";
import { listingStatusEmail, sendEmail } from "@/lib/email";
import {
  clientIp,
  getRouteSupabase,
  getServiceSupabase,
  rateLimit,
} from "@/lib/server-supabase";

type Body = {
  listing_id: string;
  status: "published" | "rejected" | "draft";
};

/**
 * POST after admin sets listing status. Requires authenticated admin.
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`notify-listing:${ip}`, 30, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429 }
      );
    }

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

    const userSb = getRouteSupabase();
    if (!userSb) {
      return NextResponse.json(
        { ok: false, error: "Auth not configured" },
        { status: 500 }
      );
    }

    const {
      data: { user },
    } = await userSb.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: prof } = await userSb
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!prof?.is_admin) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const service = getServiceSupabase();
    if (!service) {
      return NextResponse.json(
        {
          ok: false,
          error: "Notify not configured (missing SUPABASE_SERVICE_ROLE_KEY)",
          skipped: true,
        },
        { status: 503 }
      );
    }

    const { data: emailRpc, error: rpcError } = await service.rpc(
      "creator_notify_email",
      { p_creator_id: body.listing_id }
    );

    if (rpcError) {
      console.warn("[notify/listing] rpc", rpcError.message);
      return NextResponse.json(
        { ok: false, error: "Could not resolve creator contact" },
        { status: 500 }
      );
    }

    const to = (emailRpc as string | null) || null;
    if (!to) {
      return NextResponse.json({
        ok: false,
        error: "Creator email not found",
        skipped: true,
      });
    }

    let creatorName = "there";
    const { data: listing } = await service
      .from("creator_profiles")
      .select("id, profiles(full_name)")
      .eq("id", body.listing_id)
      .maybeSingle();

    const profJoin = listing?.profiles as
      | { full_name?: string }
      | { full_name?: string }[]
      | null;
    if (profJoin && !Array.isArray(profJoin) && profJoin.full_name) {
      creatorName = profJoin.full_name;
    } else if (Array.isArray(profJoin) && profJoin[0]?.full_name) {
      creatorName = profJoin[0].full_name;
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
